// src/services/users.js
// All Firestore operations related to the `users` collection.
//
// Why a separate file from auth.js?
// - auth.js talks to Firebase AUTH (the identity system: passwords, sessions, etc.)
// - users.js talks to Firebase FIRESTORE (our app's own database of user profiles)
// These are two different Firebase services. Keeping them in different files
// makes it easier to reason about who is doing what.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '../firebase/config'

// ──────────────────────────────────────────────────────────────
// Constants — single source of truth so we don't typo "admin"
// somewhere and silently break role checks.
// ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
}

// ──────────────────────────────────────────────────────────────
// 1. ENSURE USER DOCUMENT EXISTS
// ──────────────────────────────────────────────────────────────
// Called after every successful sign-up or sign-in. Behavior:
//   - First time: creates a new doc at users/{uid} with role="user"
//   - Returning user: only updates `lastLogin` (does NOT overwrite role/createdAt)
//
// This split matters because if we naively did `setDoc(ref, allFields, {merge:true})`
// on every login, the `role` field would get reset to "user" every time the user
// signed in — which would silently wipe admin privileges. We avoid that bug by
// checking existence first.
//
// Args:
//   firebaseUser     — the User object returned by Firebase Auth
//   authProvider     — 'password' or 'google' (just for analytics, not security)
//
// Returns: the full user profile object from Firestore (after the write).
export async function ensureUserDocument(firebaseUser, authProvider = 'password') {
  if (!firebaseUser?.uid) {
    throw new Error('ensureUserDocument: firebaseUser.uid is required')
  }

  // Build the reference to users/{uid}. Note: we use uid as the document ID
  // instead of letting Firestore auto-generate one. This is intentional —
  // it makes lookups trivial (`getDoc(doc(db, 'users', uid))`) and makes
  // security rules much cleaner.
  const userRef = doc(db, 'users', firebaseUser.uid)

  // Check whether this user already has a profile doc.
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    // FIRST-TIME LOGIN — create the full profile.
    const newProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName:
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Anonymous',
      photoURL: firebaseUser.photoURL || null,
      role: ROLES.USER,           // Everyone starts as a regular user.
      authProvider,                // 'password' or 'google'
      createdAt: serverTimestamp(), // Server clock, not client — more reliable.
      lastLogin: serverTimestamp(),
    }
    await setDoc(userRef, newProfile)
    // serverTimestamp() returns a special sentinel in the write payload;
    // when we read the doc back below it will be resolved to a real timestamp.
    const created = await getDoc(userRef)
    return { id: created.id, ...created.data() }
  }

  // RETURNING USER — only touch lastLogin. Leave role, createdAt, etc. alone.
  await updateDoc(userRef, {
    lastLogin: serverTimestamp(),
    // Also refresh email/displayName/photoURL in case the user changed them
    // in their Google account or via Profile page. Safe to update — these
    // are not security-sensitive fields.
    email: firebaseUser.email,
    displayName:
      firebaseUser.displayName ||
      snapshot.data().displayName, // fall back to existing if Firebase has none
    photoURL: firebaseUser.photoURL || snapshot.data().photoURL || null,
  })

  const refreshed = await getDoc(userRef)
  return { id: refreshed.id, ...refreshed.data() }
}

// ──────────────────────────────────────────────────────────────
// 2. GET USER PROFILE BY UID
// ──────────────────────────────────────────────────────────────
// Used by AuthContext to load the role/profile after Firebase confirms login.
//
// Returns: profile object, or null if no doc exists (shouldn't happen for
// users who signed up through our app, but defensive coding doesn't hurt).
export async function getUserProfile(uid) {
  if (!uid) return null
  const userRef = doc(db, 'users', uid)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

// ──────────────────────────────────────────────────────────────
// 3. GET ALL USERS (Admin Dashboard + Chat user list)
// ──────────────────────────────────────────────────────────────
// Returns every user profile, newest first. Used by:
//   - Admin Dashboard (to show analytics + manage users)
//   - Chat page (to display the list of people you can chat with)
//
// For a production app you'd paginate this; for an assignment with a few
// dozen users it's fine to fetch them all.
export async function getAllUsers() {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ──────────────────────────────────────────────────────────────
// 4. GET USERS BY ROLE (used for admin analytics)
// ──────────────────────────────────────────────────────────────
export async function getUsersByRole(role) {
  const usersRef = collection(db, 'users')
  const q = query(usersRef, where('role', '==', role))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ──────────────────────────────────────────────────────────────
// 5. UPDATE USER ROLE (Admin-only action)
// ──────────────────────────────────────────────────────────────
// Called from the Admin Dashboard to promote/demote a user.
// Firestore security rules will (later) prevent non-admins from calling this
// even if they bypass the UI.
export async function updateUserRole(uid, newRole) {
  if (!Object.values(ROLES).includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`)
  }
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { role: newRole })
}

// ──────────────────────────────────────────────────────────────
// Helper: is this profile an admin?
// ──────────────────────────────────────────────────────────────
// Convenience used in components so we don't repeat the string literal.
export function isAdmin(profile) {
  return profile?.role === ROLES.ADMIN
}