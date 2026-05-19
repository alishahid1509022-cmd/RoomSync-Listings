// src/services/listings.js
// All Firestore operations related to the `listings` collection.
//
// Mirrors the pattern of users.js and auth.js — pages should call these
// functions instead of importing firestore methods directly. This keeps
// our database logic in one place, makes it easy to add admin overrides
// later, and means our pages stay focused on UI.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore'

import { db } from '../firebase/config'

// The collection reference — built once and reused everywhere.
// Wrapping it in a function (not a top-level const) avoids any weird
// "imported before db was initialized" edge cases.
const listingsCol = () => collection(db, 'listings')

// ──────────────────────────────────────────────────────────────
// 1. GET ALL LISTINGS (public — used by /all browsing page)
// ──────────────────────────────────────────────────────────────
// Ordered newest first. For a real app you'd paginate; for an
// assignment-sized dataset this is fine.
export async function getAllListings() {
  const q = query(listingsCol(), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ──────────────────────────────────────────────────────────────
// 2. GET ONE LISTING BY ID (used by /view/:id and /edit/:id)
// ──────────────────────────────────────────────────────────────
// Returns null if no listing with that ID exists — caller can show
// a "not found" message.
export async function getListingById(id) {
  if (!id) return null
  const ref = doc(db, 'listings', id)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

// ──────────────────────────────────────────────────────────────
// 3. GET LISTINGS BY USER (used by /my-listings dashboard)
// ──────────────────────────────────────────────────────────────
// Fetches every listing where createdBy.uid matches. Firestore CAN
// query nested fields with dot notation — that's why this works even
// though createdBy is an object, not a top-level field.
//
// Sorting note: ordering by createdAt alongside a where() filter
// usually requires a Firestore composite index. If you ever see
// "FirebaseError: The query requires an index" in the console, the
// error message itself gives you a clickable link to auto-create it.
export async function getListingsByUser(uid) {
  if (!uid) return []
  const q = query(
    listingsCol(),
    where('createdBy.uid', '==', uid),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ──────────────────────────────────────────────────────────────
// 4. COUNT TOTAL LISTINGS (used by admin analytics)
// ──────────────────────────────────────────────────────────────
// getCountFromServer is more efficient than fetching every doc just
// to count them — Firestore does the counting on its side and only
// sends back the number. Much cheaper for big collections.
export async function getListingsCount() {
  const snapshot = await getCountFromServer(listingsCol())
  return snapshot.data().count
}

// ──────────────────────────────────────────────────────────────
// 5. CREATE A LISTING (used by /create)
// ──────────────────────────────────────────────────────────────
// We accept the raw form data plus the current Firebase Auth user,
// and we attach createdBy + createdAt server-side. Doing it here
// (instead of inside the page) means every listing is guaranteed
// to have the same shape — no chance of a page forgetting to set
// createdBy and bypassing security rules.
//
// data shape: { title, location, roomType, furnished, rent, imageUrl, ... }
// currentUser: the Firebase Auth User object (auth.currentUser)
export async function createListing(data, currentUser) {
  if (!currentUser) {
    throw new Error('You must be signed in to create a listing.')
  }
  const payload = {
    ...data,
    rent: Number(data.rent), // store as number, not string
    createdAt: serverTimestamp(),
    createdBy: {
      uid: currentUser.uid,
      displayName:
        currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
      email: currentUser.email,
    },
  }
  const ref = await addDoc(listingsCol(), payload)
  return ref.id
}

// ──────────────────────────────────────────────────────────────
// 6. UPDATE A LISTING (used by /edit/:id)
// ──────────────────────────────────────────────────────────────
// Plain update — the OWNERSHIP CHECK ("is this user allowed to edit?")
// will be added in Step 5 once we wire up admin overrides. For now,
// Firestore security rules are the enforcement layer; the rules already
// say "only the creator can update" so a non-creator calling this just
// gets a permission-denied error from Firebase, not a security hole.
export async function updateListing(id, data) {
  if (!id) throw new Error('updateListing: id is required')
  const ref = doc(db, 'listings', id)
  // Strip out fields that shouldn't ever be overwritten on edit.
  // createdAt and createdBy are set at creation time and must never change.
  // eslint-disable-next-line no-unused-vars
  const { createdAt, createdBy, id: _ignoredId, ...safeData } = data
  await updateDoc(ref, {
    ...safeData,
    rent: data.rent !== undefined ? Number(data.rent) : undefined,
    updatedAt: serverTimestamp(),
  })
}

// ──────────────────────────────────────────────────────────────
// 7. DELETE A LISTING (used by /view/:id and /all)
// ──────────────────────────────────────────────────────────────
// Same note as updateListing — security rules enforce ownership.
// Admin override will be added in Step 5.
export async function deleteListing(id) {
  if (!id) throw new Error('deleteListing: id is required')
  const ref = doc(db, 'listings', id)
  await deleteDoc(ref)
}