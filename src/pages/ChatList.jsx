import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, ROLES } from '../services/users'

// ChatList — the /chat page.
// Shows every registered user (except yourself). Click one → opens a conversation.
// Simple "user directory" approach, per Step 6 spec: "chat between any two
// registered users."
//
// For Assignment 04 we keep it simple — no "recent chats" sidebar, no unread
// counts. Just a list of people you can talk to.
const ChatList = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const all = await getAllUsers()
        // Filter out yourself — no point chatting with yourself
        const others = all.filter((u) => u.uid !== currentUser?.uid)
        setUsers(others)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [currentUser])

  // Client-side filter for the search box. Filters by displayName OR email.
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  })

  // ── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">Messages</h1>
        <p className="page-subtitle">Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">Messages</h1>
        <div className="alert-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Messages</h1>
      <p className="page-subtitle">
        Start a conversation with any registered user.
      </p>

      {/* Search box */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
          }}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <p className="page-subtitle">
          {searchQuery
            ? `No users match "${searchQuery}".`
            : 'No other users registered yet.'}
        </p>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {filteredUsers.map((user, idx) => (
            <div
              key={user.uid}
              onClick={() => navigate(`/chat/${user.uid}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                cursor: 'pointer',
                borderTop: idx === 0 ? 'none' : '1px solid #e5e7eb',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = '#f0fdfa')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'white')
              }
            >
              {/* Avatar circle — uses photoURL if available, else initials */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#14b8a6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                  }}
                >
                  {(user.displayName || user.email || '?')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {user.displayName || 'Unnamed user'}
                  {user.role === ROLES.ADMIN && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.6875rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontWeight: 700,
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {user.email}
                </div>
              </div>

              <div style={{ color: '#9ca3af', fontSize: '1.25rem' }}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatList