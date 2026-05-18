// AuthContext — the single source of truth for "who is logged in"
// Any component can call `useAuth()` to access the current user.

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'

// 1. Create the Context object (the "broadcast channel")
const AuthContext = createContext(null)

// 2. The Provider component — wrap the whole app with this in main.jsx
export function AuthProvider({ children }) {
  // currentUser will be a Firebase User object, or null if logged out
  const [currentUser, setCurrentUser] = useState(null)

  // loading is true while we're waiting for Firebase to tell us the initial state.
  // We need this because on page refresh, there's a brief moment where Firebase
  // is checking if the user has a saved session. Without this flag, components
  // would flash "logged out" content before flashing back to "logged in".
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to Firebase Auth state changes.
    // Firebase calls our callback once immediately, then again on every change.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user) // user is the Firebase User object, or null
      setLoading(false)    // we now know the real state, stop "loading"
    })

    // Cleanup: when the AuthProvider unmounts, stop listening.
    // (In practice this only happens when the whole app unmounts.)
    return () => unsubscribe()
  }, [])

  // The value broadcast to every consumer of this Context
  const value = {
    currentUser,
    loading,
    // Convenience boolean — easier to read in components than `!!currentUser`
    isLoggedIn: !!currentUser,
  }

  // While Firebase is figuring out the initial state, render nothing.
  // This prevents a flash of "logged out" UI on page refresh.
  // Alternative: render a spinner. For now, blank is fine — it's <300ms.
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