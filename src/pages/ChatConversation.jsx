import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserProfile } from '../services/users'
import {
  ensureChatExists,
  sendMessage,
  subscribeToMessages,
  getChatId,
} from '../services/chats'

// ChatConversation — the /chat/:userId page.
//
// Real-time 1-on-1 conversation between currentUser and the other user.
// Uses onSnapshot via subscribeToMessages — new messages appear instantly
// without a refresh.
//
// Lifecycle in plain English:
//   1. On mount: figure out the chat ID, make sure the chat doc exists,
//      load the other user's profile (for the header), subscribe to messages.
//   2. While mounted: render messages, let user type & send new ones.
//   3. On unmount: unsubscribe from the message listener.
const ChatConversation = () => {
  const { userId: otherUserId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [otherUser, setOtherUser] = useState(null) // their profile
  const [messages, setMessages] = useState([])
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // chatId is deterministic — same two users always produce the same ID
  const chatId =
    currentUser && otherUserId ? getChatId(currentUser.uid, otherUserId) : null

  // Ref for the messages container, used to scroll to bottom on new message
  const messagesEndRef = useRef(null)

  // ──────────────────────────────────────────────────────────
  // Setup effect — runs on mount + whenever the otherUserId changes
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !otherUserId) return

    // Guard: can't chat with yourself
    if (currentUser.uid === otherUserId) {
      setError("You can't chat with yourself.")
      setLoading(false)
      return
    }

    let unsubscribe = null

    const setup = async () => {
      try {
        setLoading(true)
        setError('')

        // 1. Load the other user's profile (for the header)
        const profile = await getUserProfile(otherUserId)
        if (!profile) {
          setError('User not found.')
          setLoading(false)
          return
        }
        setOtherUser(profile)

        // 2. Make sure the chat doc exists (creates it on first message ever)
        await ensureChatExists(currentUser.uid, otherUserId)

        // 3. Subscribe to messages in real time
        unsubscribe = subscribeToMessages(
          chatId,
          (msgs) => {
            setMessages(msgs)
            setLoading(false)
          },
          (err) => {
            setError('Failed to load messages.')
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('Chat setup error:', err)
        setError('Failed to start chat.')
        setLoading(false)
      }
    }

    setup()

    // Cleanup: stop listening when the component unmounts or otherUserId changes
    return () => {
      if (unsubscribe) unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, otherUserId])

  // ──────────────────────────────────────────────────────────
  // Auto-scroll to bottom whenever messages change
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // ──────────────────────────────────────────────────────────
  // Send handler
  // ──────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    const text = newText.trim()
    if (!text || sending || !chatId) return

    setSending(true)
    setNewText('') // optimistic — clear input immediately
    try {
      await sendMessage(chatId, currentUser.uid, text)
      // No need to manually add to messages — onSnapshot will fire and update us
    } catch (err) {
      console.error('Send error:', err)
      setError('Failed to send message. Please try again.')
      setNewText(text) // restore on failure
    } finally {
      setSending(false)
    }
  }

  // Helper: format a Firestore timestamp for display next to a message
  const formatTime = (timestamp) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    return date.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ── Render ────────────────────────────────────────────────

  if (error && !otherUser) {
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
        <Link
          to="/chat"
          className="btn-secondary"
          style={{ display: 'inline-block', marginTop: '1rem' }}
        >
          ← Back to messages
        </Link>
      </div>
    )
  }

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      {/* Back link */}
      <Link to="/chat" className="back-link">
        ← Back to messages
      </Link>

      {/* Header — who you're talking to */}
      {otherUser && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px 8px 0 0',
            borderBottom: '1px solid #e5e7eb',
            marginTop: '0.5rem',
          }}
        >
          {otherUser.photoURL ? (
            <img
              src={otherUser.photoURL}
              alt={otherUser.displayName}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#14b8a6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {(otherUser.displayName || otherUser.email || '?')
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#1f2937' }}>
              {otherUser.displayName || 'Unnamed user'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {otherUser.email}
            </div>
          </div>
        </div>
      )}

      {/* Messages list — scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</p>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
            No messages yet. Say hi! 👋
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser?.uid
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                }}
              >
                <div
                  style={{
                    background: isMine ? '#14b8a6' : 'white',
                    color: isMine ? 'white' : '#1f2937',
                    padding: '0.5rem 0.875rem',
                    borderRadius: isMine
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: '#9ca3af',
                    marginTop: '0.125rem',
                    textAlign: isMine ? 'right' : 'left',
                    paddingLeft: '0.25rem',
                    paddingRight: '0.25rem',
                  }}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            )
          })
        )}
        {/* Invisible anchor we scroll into view on new message */}
        <div ref={messagesEndRef} />
      </div>

      {/* Inline error (if send failed) */}
      {error && otherUser && (
        <div
          className="alert-error"
          style={{ margin: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          {error}
        </div>
      )}

      {/* Composer — type and send.
          NOTE: We use a div with handlers, NOT a <form> — the parent project
          guideline (and many React patterns) prefer that, but a form here is
          fine. We keep <form> so Enter-to-send works for free. */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'white',
          borderRadius: '0 0 8px 8px',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          disabled={sending || !!error}
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            border: '1px solid #d1d5db',
            borderRadius: '20px',
            fontSize: '0.9375rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={sending || !newText.trim() || !!error}
          style={{ borderRadius: '20px', padding: '0.625rem 1.25rem' }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

export default ChatConversation