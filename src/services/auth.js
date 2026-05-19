// src/services/auth.js
// All authentication logic for RoomSync, in one place.
// Pages and components import these functions; they should never call
// Firebase auth methods directly.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  signInWithPopup,
} from 'firebase/auth'

import { auth, googleProvider } from '../firebase/config'
import { ensureUserDocument } from './users'

// ──────────────────────────────────────────────────────────────
// 1. CREATE USER (Sign up with email + password)
// ──────────────────────────────────────────────────────────────
// After creating the account, we also set the displayName so it shows
// up in the UI (Firebase doesn't accept displayName at creation time —
// you have to do it as a second step).
//
// Returns: the Firebase User object
// Throws:  Firebase error (e.g. 'auth/email-already-in-use')
export async function signUpWithEmail({ email, password, displayName }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }
  // Create the matching Firestore user profile (with role="user" by default).
  // We do this AFTER updateProfile so the doc captures the displayName.
  await ensureUserDocument(credential.user, 'password')
  return credential.user
}

// ──────────────────────────────────────────────────────────────
// 2. SIGN IN (Email + password)
// ──────────────────────────────────────────────────────────────
// Returns: the Firebase User object
// Throws:  'auth/wrong-password', 'auth/user-not-found', etc.
export async function signInWithEmail({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  // Update lastLogin timestamp; safe to call even if the doc already exists.
  // Won't overwrite role or createdAt — see ensureUserDocument for details.
  await ensureUserDocument(credential.user, 'password')
  return credential.user
}

// ──────────────────────────────────────────────────────────────
// 3. RESET PASSWORD (while logged in — change current password)
// ──────────────────────────────────────────────────────────────
// This is the "I know my old password and want to change it" case.
// Firebase requires the user to have signed in recently — if not,
// it throws 'auth/requires-recent-login' and you'd have to ask the
// user to sign in again first.
export async function resetPasswordForCurrentUser(newPassword) {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  await updatePassword(auth.currentUser, newPassword)
}

// ──────────────────────────────────────────────────────────────
// 4. FORGOT PASSWORD (logged out — send reset email)
// ──────────────────────────────────────────────────────────────
// Sends a password-reset email to the address. Firebase handles
// the whole email + reset-link flow on its own pages.
//
// Note: Firebase intentionally doesn't tell you whether the email
// was actually registered (security best practice — prevents
// email-enumeration attacks). So the UI should always say
// "If an account exists, you'll get an email" regardless.
export async function sendForgotPasswordEmail(email) {
  await sendPasswordResetEmail(auth, email)
}

// ──────────────────────────────────────────────────────────────
// 5. SIGN OUT (the lab calls this "Remove user")
// ──────────────────────────────────────────────────────────────
// Ends the current session. The account itself remains in Firebase
// and the user can log back in later.
export async function signOutUser() {
  await signOut(auth)
}

// ──────────────────────────────────────────────────────────────
// 6. DELETE USER (permanently destroy the account)
// ──────────────────────────────────────────────────────────────
// Removes the user from Firebase Auth entirely. Their UID is gone.
// Firebase requires recent login — if the user signed in more than
// ~5 minutes ago, this throws 'auth/requires-recent-login' and you
// must re-authenticate them before retrying.
//
// IMPORTANT: this only deletes the auth account. Their Firestore
// data (listings they created, etc.) remains. In a real app you'd
// want to either delete or anonymize that data here too — for this
// lab, we keep it simple.
export async function deleteCurrentUser() {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  await deleteUser(auth.currentUser)
}

// ──────────────────────────────────────────────────────────────
// 7. UPDATE PROFILE (displayName, photoURL)
// ──────────────────────────────────────────────────────────────
// Firebase's User object has a displayName and photoURL field that
// most apps use for "who is this person." updateProfile is how you
// change them. Pass either or both — undefined fields are ignored.
export async function updateUserProfile({ displayName, photoURL }) {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  // Build payload with only fields that were actually passed in,
  // so calling updateUserProfile({ displayName: 'X' }) doesn't wipe photoURL.
  const updates = {}
  if (displayName !== undefined) updates.displayName = displayName
  if (photoURL !== undefined) updates.photoURL = photoURL
  await updateProfile(auth.currentUser, updates)
}

// ──────────────────────────────────────────────────────────────
// 8. GOOGLE SIGN IN
// ──────────────────────────────────────────────────────────────
// Opens the Google OAuth popup, lets the user pick a Google account,
// and signs them into Firebase. No password handling on our side.
//
// If the user closes the popup without picking an account, Firebase
// throws 'auth/popup-closed-by-user' — UI should treat this as a
// silent cancel, not an error.
export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider)
  // First-time Google users get a fresh user doc; returning users get
  // their lastLogin updated. The 'google' authProvider tag is just for
  // analytics / debugging — security rules don't depend on it.
  await ensureUserDocument(credential.user, 'google')
  return credential.user
}

// ──────────────────────────────────────────────────────────────
// Helper: convert Firebase error codes to user-friendly messages.
// Pages call this in their catch blocks before showing the error.
// ──────────────────────────────────────────────────────────────
export function getAuthErrorMessage(error) {
  const code = error?.code || ''
  switch (code) {
    // Sign up errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.'
    case 'auth/invalid-email':
      return 'That doesn’t look like a valid email address.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.'
    // Sign in errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again later or reset your password.'
    // Session errors
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again before doing this.'
    // Google popup
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null // Silent cancel — don't show an error
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked. Please allow popups for this site.'
    // Network
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.'
    default:
      return error?.message || 'Something went wrong. Please try again.'
  }
}