import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../services/auth'

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false)
  const { currentUser, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  const handleSignOut = async () => {
    try {
      await signOutUser()
      navigate('/')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  // Just the user's first name, falls back to email if no displayName set
  const greetingName =
    currentUser?.displayName?.split(' ')[0] ||
    currentUser?.email?.split('@')[0] ||
    'there'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏠</span>
          <span className="brand-text">RoomSync</span>
        </Link>

        <ul className="navbar-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/all" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              All Listings
            </NavLink>
          </li>

          {/* Show "Add Listing" only when logged in (clicking it would redirect anyway, but cleaner this way) */}
          {isLoggedIn && (
            <li>
              <NavLink to="/create" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Add Listing
              </NavLink>
            </li>
          )}

          {isLoggedIn ? (
            <>
              <li>
                <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Hi, {greetingName}
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Sign in
                </NavLink>
              </li>
              <li>
                <NavLink to="/signup" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                  Sign up
                </NavLink>
              </li>
            </>
          )}
        </ul>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="theme-toggle"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}

export default Navbar