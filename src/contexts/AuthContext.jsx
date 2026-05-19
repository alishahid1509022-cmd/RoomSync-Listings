// AuthContext — the single source of truth for "who is logged in"
// Any component can call `useAuth()` to access the current user.
//
// Step 2 (Assignment 04) extension:
// In addition to Firebase Auth state, we now also load the user's Firestore
// profile (which contains their role, displayName, photoURL, etc.) and expose
// it to the whole app. This is what lets components ask "is this person an
// admin?" without each one having to hit Firestore separately.

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getUserProfile, ROLES } from '../services/users'

// 1. Create the Context object (the "broadcast channel")
const AuthContext = createContext(null)

// 2. The Provider component — wrap the whole app with this in main.jsx
export function AuthProvider({ children }) {
  // currentUser will be a Firebase Auth User object, or null if logged out.
  // This is the *identity* — uid, email, displayName from Firebase Auth itself.
  const [currentUser, setCurrentUser] = useState(null)

  // userProfile is the matching doc from Firestore (users/{uid}).
  // This is where role lives, along with createdAt, lastLogin, authProvider.
  // null when logged out OR while we're still fetching after login.
  const [userProfile, setUserProfile] = useState(null)

  // loading is true while we're waiting for Firebase to tell us the initial state
  // AND for the Firestore profile to load. Without this, components would flash
  // "logged out" or "no role yet" content on page refresh.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to Firebase Auth state changes.
    // Firebase calls our callback once immediately (on app load with the
    // saved session, if any), then again on every sign-in / sign-out.
    //
    // Note: we mark the callback `async` so we can `await` the Firestore
    // profile fetch. onAuthStateChanged doesn't care whether we return a
    // Promise — it just won't wait for it, which is fine here.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // SIGNED IN — set the auth user immediately, then fetch the profile.
        setCurrentUser(user)
        try {
          const profile = await getUserProfile(user.uid)
          setUserProfile(profile)
          // If profile is null here, it means a user exists in Firebase Auth
          // but has no Firestore doc. Shouldn't happen for accounts created
          // through our app (ensureUserDocument runs at signup/signin), but
          // could happen for accounts created manually in the Firebase Console.
          // We just leave userProfile as null and let the app handle it.
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err)
          setUserProfile(null)
        }
      } else {
        // SIGNED OUT — clear everything.
        setCurrentUser(null)
        setUserProfile(null)
      }
      setLoading(false) // We now know the real state, stop "loading"
    })

    // Cleanup: when the AuthProvider unmounts, stop listening.
    // (In practice this only happens when the whole app unmounts.)
    return () => unsubscribe()
  }, [])

  // Convenience values derived from userProfile.
  // Computed here so every component doesn't have to repeat the same check.
  const role = userProfile?.role ?? null
  const isAdmin = role === ROLES.ADMIN

  // The value broadcast to every consumer of this Context
  const value = {
    // Auth identity (from Firebase Auth)
    currentUser,
    isLoggedIn: !!currentUser,

    // App profile (from Firestore)
    userProfile,
    role,
    isAdmin,

    // Loading flag — true until we know both auth state AND profile state
    loading,

    // Lets a component force a profile re-fetch (e.g. after editing their own
    // profile, or after an admin promotes someone). Optional but handy.
    refreshUserProfile: async () => {
      if (!currentUser) return
      const profile = await getUserProfile(currentUser.uid)
      setUserProfile(profile)
    },
  }

  // While Firebase is figuring out the initial state, render nothing.
  // This prevents a flash of "logged out" UI on page refresh.
  // Alternative: render a spinner. For now, blank is fine — it's <500ms.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

// 3. The custom hook — what other components use to access auth state.
// Instead of `useContext(AuthContext)` everywhere, components do `useAuth()`.
// Cleaner, and lets us add error handling in one place.
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error(
      'useAuth() must be used inside an <AuthProvider>. ' +
      'Did you forget to wrap your app in main.jsx?'
    )
  }
  return context
}