import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
} from '../services/auth'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const location = useLocation()

  // If the user was redirected here from a protected route,
  // Phase 8's ProtectedRoute will pass `from` in location.state
  // so we can send them back where they originally wanted to go.
  const redirectTo = location.state?.from?.pathname || '/my-listings'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signInWithEmail(formData)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
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
      navigate(redirectTo, { replace: true })
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
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your RoomSync account</p>

        {location.state?.message && (
          <div className="alert-success">{location.state.message}</div>
        )}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              placeholder="Your password"
              required
              autoComplete="current-password"
            />
          </div>

          <Link to="/forgot-password" className="auth-inline-link">
            Forgot password?
          </Link>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || googleLoading}
            style={{ width: '100%' }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button
          type="button"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={submitting || googleLoading}
        >
          {googleLoading ? 'Opening Google...' : '🔑 Sign in with Google'}
        </button>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  )
}

export default Login