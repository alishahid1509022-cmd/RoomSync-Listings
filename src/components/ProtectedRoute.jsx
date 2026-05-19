import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ProtectedRoute — the "bouncer" component.
//
// Two levels of strictness, controlled by the `requireRole` prop:
//
//   1. <ProtectedRoute><Page /></ProtectedRoute>
//      → just checks that someone is logged in. Any role is fine.
//
//   2. <ProtectedRoute requireRole="admin"><Page /></ProtectedRoute>
//      → checks that the user is logged in AND has role === "admin".
//      Non-admins get bounced to the home page with a "not authorized" message.
//
// Why two redirect destinations?
//   - Not logged in → /login (so they can sign in and try again)
//   - Logged in but wrong role → / (no point sending an admin-less user to /login,
//     they already ARE logged in; we just want them off this page)
const ProtectedRoute = ({ children, requireRole = null }) => {
  const { isLoggedIn, role, loading } = useAuth()
  const location = useLocation()

  // Safety net: AuthContext already blocks rendering until loading is false,
  // but if that ever changes, this guard prevents a flash of redirect.
  if (loading) {
    return null
  }

  // CHECK 1: Must be logged in.
  if (!isLoggedIn) {
    // Save the attempted destination so /login can send them back after sign-in
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Please log in to continue.',
        }}
      />
    )
  }

  // CHECK 2: If this route requires a specific role, enforce it.
  // Only runs when requireRole was passed in. Plain logged-in users sail through.
  if (requireRole && role !== requireRole) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          message: `Access denied. This page requires ${requireRole} privileges.`,
        }}
      />
    )
  }

  // Both checks passed — render the protected page.
  return children
}

export default ProtectedRoute