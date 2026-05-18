import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  signUpWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
} from '../services/auth'

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation before hitting Firebase
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await signUpWithEmail({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      })
      // After signup the user is automatically signed in by Firebase.
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Signup error:', err)
      const message = getAuthErrorMessage(err)
      if (message) setError(message)
      setSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Google sign-in error:', err)
      const message = getAuthErrorMessage(err)
      if (message) setError(message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Find your perfect roommate on RoomSync</p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="Your full name"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Type it again"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || googleLoading}
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={submitting || googleLoading}
        >
          {googleLoading ? 'Opening Google...' : '🔑 Sign up with Google'}
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}

export default Signup