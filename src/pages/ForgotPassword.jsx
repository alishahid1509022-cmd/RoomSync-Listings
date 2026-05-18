import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  sendForgotPasswordEmail,
  getAuthErrorMessage,
} from '../services/auth'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await sendForgotPasswordEmail(email)
      setSuccess(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      // We deliberately show success even if the email isn't registered,
      // to prevent attackers from using this page to discover whether
      // an email is in our system (standard security practice).
      // We only show a real error for network/Firebase outages.
      if (err?.code === 'auth/network-request-failed') {
        setError(getAuthErrorMessage(err))
      } else {
        setSuccess(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">
          We'll email you a link to reset it.
        </p>

        {success ? (
          <div className="alert-success">
            If an account exists for that email, a password reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <>
            {error && <div className="alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword