import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  signOutUser,
  updateUserProfile,
  resetPasswordForCurrentUser,
  deleteCurrentUser,
  getAuthErrorMessage,
} from '../services/auth'

const Profile = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Display-name update
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [savingName, setSavingName] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete account
  const [deleting, setDeleting] = useState(false)

  // Shared error display
  const [error, setError] = useState('')

  // Guard: if somehow this renders without a user, send them to /login.
  // Phase 8's ProtectedRoute will normally prevent reaching here logged out.
  if (!currentUser) {
    navigate('/login', { replace: true })
    return null
  }

  const handleUpdateName = async (e) => {
    e.preventDefault()
    setSavingName(true)
    setError('')
    setNameSuccess(false)
    try {
      await updateUserProfile({ displayName: displayName.trim() })
      setNameSuccess(true)
      // Hide the success message after 3 seconds
      setTimeout(() => setNameSuccess(false), 3000)
    } catch (err) {
      console.error('Update name error:', err)
      setError(getAuthErrorMessage(err))
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSavingPassword(true)
    setError('')
    setPasswordSuccess(false)
    try {
      await resetPasswordForCurrentUser(newPassword)
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmNewPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      console.error('Change password error:', err)
      setError(getAuthErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
      setError(getAuthErrorMessage(err))
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    try {
      await deleteCurrentUser()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Delete account error:', err)
      setError(getAuthErrorMessage(err))
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Your profile</h1>
      <p className="page-subtitle">
        Manage your account details and security.
      </p>

      {error && <div className="alert-error">{error}</div>}

      <div className="form-card">
        {/* Account info — read-only */}
        <div className="profile-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <h3>Account info</h3>
          <div className="profile-info-row">
            <strong>Email</strong>
            <span>{currentUser.email || '—'}</span>
          </div>
          <div className="profile-info-row">
            <strong>User ID</strong>
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {currentUser.uid.slice(0, 8)}…
            </span>
          </div>
          <div className="profile-info-row">
            <strong>Signed in with</strong>
            <span>
              {currentUser.providerData[0]?.providerId === 'google.com'
                ? 'Google'
                : 'Email & password'}
            </span>
          </div>
        </div>

        {/* Update display name */}
        <div className="profile-section">
          <h3>Display name</h3>
          {nameSuccess && (
            <div className="alert-success">Display name updated.</div>
          )}
          <form onSubmit={handleUpdateName}>
            <div className="form-group">
              <label htmlFor="displayName">Your name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={savingName || displayName.trim() === (currentUser.displayName || '').trim()}
            >
              {savingName ? 'Saving...' : 'Save name'}
            </button>
          </form>
        </div>

        {/* Change password (only for email/password users — Google users change theirs at Google) */}
        {currentUser.providerData[0]?.providerId === 'password' && (
          <div className="profile-section">
            <h3>Change password</h3>
            {passwordSuccess && (
              <div className="alert-success">Password updated.</div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="newPassword">New password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm new password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Type it again"
                  required
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingPassword}
              >
                {savingPassword ? 'Saving...' : 'Update password'}
              </button>
            </form>
          </div>
        )}

        {/* Session actions */}
        <div className="profile-section">
          <h3>Session</h3>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>

        {/* Danger zone */}
        <div className="profile-section">
          <h3 style={{ color: '#dc2626' }}>Danger zone</h3>
          <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Deleting your account removes it from RoomSync permanently. Your listings will remain but won't be editable.
          </p>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile