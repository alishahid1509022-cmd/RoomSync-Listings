import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../services/auth'

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false)
  const { currentUser, isLoggedIn, isAdmin } = useAuth()
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

  const initials =
    currentUser?.displayName?.slice(0, 2).toUpperCase() ||
    currentUser?.email?.slice(0, 2).toUpperCase() ||
    '??'

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏠</span>
          <span className="brand-text">RoomSync</span>
        </Link>

        {/* Centre nav links */}
        <ul className="navbar-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/all" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Browse
            </NavLink>
          </li>
          {isLoggedIn && (
            <li>
              <NavLink to="/create" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                + List Room
              </NavLink>
            </li>
          )}
          {isLoggedIn && (
            <li>
              <NavLink to="/my-listings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                My Listings
              </NavLink>
            </li>
          )}
          {isLoggedIn && (
            <li>
              <NavLink to="/chat" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Messages
              </NavLink>
            </li>
          )}
          {isLoggedIn && isAdmin && (
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="admin-badge">Admin</span>
              </NavLink>
            </li>
          )}
        </ul>

        {/* Right side */}
        <div className="navbar-right">
          {isLoggedIn ? (
            <>
              <NavLink to="/profile" className="navbar-avatar" title="Your profile">
                {initials}
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="navbar-signout"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Sign in
              </NavLink>
              <NavLink to="/signup" className="navbar-signup-btn">
                Sign up
              </NavLink>
            </>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

      </div>
    </nav>
  )
}

export default Navbar
