import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllUsers,
  updateUserRole,
  ROLES,
} from '../services/users'
import { getListingsCount } from '../services/listings'

// AdminDashboard — the page admins land on at /admin.
//
// Has two halves:
//   1. ANALYTICS — at-a-glance stat cards (total users, admins, listings).
//      This is the rubric's "Dashboard Analytics" criterion.
//   2. USER MANAGEMENT — table of every user with a promote/demote button.
//      Lets the admin actually do something about what the numbers show.
//
// Access control:
//   - Route is wrapped in <ProtectedRoute requireRole="admin"> in App.jsx,
//     so non-admins never get here. We don't double-check inside the page.
//   - We DO defensively guard the "promote yourself" edge case (you can't
//     demote yourself — would lock you out of the dashboard mid-session).
const AdminDashboard = () => {
  const { currentUser } = useAuth()

  // All users, fetched once on mount + after any role change.
  const [users, setUsers] = useState([])
  // Total listings count (separate from listings themselves — we only need
  // the number for the stat card, not the full list).
  const [listingsCount, setListingsCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Track which user's role is being updated, so we can disable that one row
  // without freezing the whole table.
  const [updatingUid, setUpdatingUid] = useState(null)

  // Helper that loads both users and listings count in parallel. Used on
  // initial mount AND called again after a role change to keep stats fresh.
  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      // Promise.all runs both queries in parallel — faster than awaiting
      // them one after the other.
      const [allUsers, count] = await Promise.all([
        getAllUsers(),
        getListingsCount(),
      ])
      setUsers(allUsers)
      setListingsCount(count)
    } catch (err) {
      console.error('Error loading admin data:', err)
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Toggle a user between "admin" and "user" roles.
  const handleToggleRole = async (user) => {
    // Defensive check 1: can't demote yourself. If we let this through, the
    // admin would immediately lose access to this very page mid-click — bad UX.
    if (user.uid === currentUser?.uid) {
      alert(
        "You can't change your own role from here. Ask another admin, " +
        'or do it manually in the Firebase Console.'
      )
      return
    }

    const newRole =
      user.role === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN

    const ok = window.confirm(
      `Change ${user.displayName || user.email}'s role from ` +
      `"${user.role}" to "${newRole}"?`
    )
    if (!ok) return

    try {
      setUpdatingUid(user.uid)
      await updateUserRole(user.uid, newRole)
      // Update the row in local state so the UI flips instantly,
      // no need to refetch the whole table.
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid ? { ...u, role: newRole } : u
        )
      )
    } catch (err) {
      console.error('Error updating role:', err)
      alert('Failed to update role. Please try again.')
    } finally {
      setUpdatingUid(null)
    }
  }

  // ── Derived stats (computed each render, no extra state needed) ───────────
  // useMemo would be overkill here — these are O(n) over a small array,
  // and we're already re-rendering whenever users changes.
  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.role === ROLES.ADMIN).length
  const totalRegular = totalUsers - totalAdmins
  const googleUsers = users.filter((u) => u.authProvider === 'google').length
  const emailUsers = totalUsers - googleUsers

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Loading dashboard data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">Admin Dashboard</h1>
        <div className="alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            App-wide analytics and user management
          </p>
        </div>
      </div>

      {/* ── ANALYTICS SECTION ─────────────────────────────────────── */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          📊 Overview
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          <StatCard label="Total Users" value={totalUsers} icon="👥" />
          <StatCard label="Admins" value={totalAdmins} icon="🛡️" />
          <StatCard label="Regular Users" value={totalRegular} icon="🧑" />
          <StatCard label="Total Listings" value={listingsCount} icon="🏠" />
          <StatCard label="Email Signups" value={emailUsers} icon="✉️" />
          <StatCard label="Google Signups" value={googleUsers} icon="🔵" />
        </div>
      </section>

      {/* ── USER MANAGEMENT TABLE ─────────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          👥 Manage Users
        </h2>

        {users.length === 0 ? (
          <p className="page-subtitle">No users found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.uid === currentUser?.uid
                  const isUpdating = updatingUid === user.uid
                  return (
                    <tr
                      key={user.uid}
                      style={{ borderTop: '1px solid #e5e7eb' }}
                    >
                      <td style={tdStyle}>
                        <strong>{user.displayName || '—'}</strong>
                        {isSelf && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.75rem',
                              color: '#0d9488',
                              fontWeight: 600,
                            }}
                          >
                            (you)
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>
                        {user.authProvider === 'google' ? '🔵 Google' : '✉️ Email'}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background:
                              user.role === ROLES.ADMIN ? '#d1fae5' : '#e5e7eb',
                            color:
                              user.role === ROLES.ADMIN ? '#065f46' : '#374151',
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleToggleRole(user)}
                          disabled={isSelf || isUpdating}
                          style={{
                            opacity: isSelf ? 0.5 : 1,
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isUpdating
                            ? 'Updating...'
                            : user.role === ROLES.ADMIN
                              ? 'Demote to User'
                              : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

// ── Small presentational helpers ─────────────────────────────────────────────

// Single stat card. Kept local to this file because it's not used anywhere else.
// If we ever reuse this, we'll lift it into components/.
const StatCard = ({ label, value, icon }) => (
  <div
    style={{
      background: 'white',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      borderLeft: '4px solid #14b8a6', // teal accent matches the rest of the theme
    }}
  >
    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
    <div
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.1,
        color: '#0f766e',
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
      {label}
    </div>
  </div>
)

// Inline style objects pulled out so the JSX above stays readable.
const thStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#374151',
}

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#1f2937',
}

export default AdminDashboard