// src/services/chats.js
// All Firestore operations related to chats and messages.
//
// Data model:
//   chats/{chatId}                    ← one doc per 1-on-1 conversation
//     participants: [uidA, uidB]      ← sorted, used for security rules
//     createdAt: timestamp
//     lastMessage: string             ← for preview in chat list
//     lastMessageAt: timestamp        ← for sorting chat list
//   chats/{chatId}/messages/{msgId}   ← subcollection of messages
//     senderId: uid
//     text: string
//     createdAt: timestamp
//
// chatId is deterministic: sort the two UIDs alphabetically, join with "_".
// Same two users → same chatId → same conversation, no matter who starts it.

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../firebase/config'

// ──────────────────────────────────────────────────────────────
// Compute a deterministic chat ID from two user UIDs.
// Sorting ensures (A, B) and (B, A) produce the same ID.
// ──────────────────────────────────────────────────────────────
export function getChatId(uidA, uidB) {
  if (!uidA || !uidB) throw new Error('getChatId: both UIDs are required')
  return [uidA, uidB].sort().join('_')
}

// ──────────────────────────────────────────────────────────────
// Ensure a chat doc exists between two users.
// Called the first time anyone opens /chat/:otherUserId.
// Safe to call repeatedly — uses check-first-then-write so we don't
// overwrite existing data like lastMessage.
// ──────────────────────────────────────────────────────────────
export async function ensureChatExists(myUid, otherUid) {
  const chatId = getChatId(myUid, otherUid)
  const chatRef = doc(db, 'chats', chatId)
  const snap = await getDoc(chatRef)

  if (!snap.exists()) {
    // First time these two users are chatting — create the doc.
    await setDoc(chatRef, {
      participants: [myUid, otherUid].sort(),
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    })
  }
  return chatId
}

// ──────────────────────────────────────────────────────────────
// Send a message in a chat.
// Adds the message to the subcollection AND updates the parent chat's
// lastMessage + lastMessageAt fields (used to show previews in a chat list).
// ──────────────────────────────────────────────────────────────
export async function sendMessage(chatId, senderUid, text) {
  const trimmed = text?.trim()
  if (!trimmed) throw new Error('Cannot send an empty message')
  if (!chatId || !senderUid) throw new Error('Missing chatId or senderUid')

  // 1. Add the message doc to the subcollection
  const messagesCol = collection(db, 'chats', chatId, 'messages')
  await addDoc(messagesCol, {
    senderId: senderUid,
    text: trimmed,
    createdAt: serverTimestamp(),
  })

  // 2. Update the parent chat doc with preview info
  const chatRef = doc(db, 'chats', chatId)
  await updateDoc(chatRef, {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  })
}

// ──────────────────────────────────────────────────────────────
// Subscribe to messages in a chat in REAL TIME.
//
// onSnapshot is Firestore's live-listener API. Whenever a new message is
// written (by anyone), our callback fires again with the full updated list.
// That's what makes the chat feel instant.
//
// IMPORTANT — returns an "unsubscribe" function. The caller MUST call it
// when the component unmounts, or we'll leak listeners (and read quota).
// In React, this means returning it from useEffect's cleanup function.
//
// Usage:
//   useEffect(() => {
//     const unsub = subscribeToMessages(chatId, setMessages)
//     return () => unsub()
//   }, [chatId])
// ──────────────────────────────────────────────────────────────
export function subscribeToMessages(chatId, onUpdate, onError) {
  if (!chatId) throw new Error('subscribeToMessages: chatId is required')

  const messagesCol = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesCol, orderBy('createdAt', 'asc')) // oldest first

  // The 3-arg form lets us also handle errors (permission denied, etc.)
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      onUpdate(messages)
    },
    (err) => {
      console.error('subscribeToMessages error:', err)
      if (onError) onError(err)
    }
  )

  return unsubscribe
}

// ──────────────────────────────────────────────────────────────
// Subscribe to the list of all chats the current user is part of.
// Used to show a "recent conversations" view (we won't display this
// in Assignment 04 — we just use the user list for chat list — but
// keeping it here for future use / cleaner service file.)
// ──────────────────────────────────────────────────────────────
export function subscribeToMyChats(myUid, onUpdate, onError) {
  if (!myUid) throw new Error('subscribeToMyChats: myUid is required')

  const chatsCol = collection(db, 'chats')
  // array-contains lets us find docs where participants includes my UID
  const q = query(
    chatsCol,
    where('participants', 'array-contains', myUid),
    orderBy('lastMessageAt', 'desc')
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      onUpdate(chats)
    },
    (err) => {
      console.error('subscribeToMyChats error:', err)
      if (onError) onError(err)
    }
  )

  return unsubscribe
}