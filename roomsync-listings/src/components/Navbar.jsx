import { Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏠</span>
          <span className="brand-text">RoomSync</span>
        </Link>

        <ul className="navbar-links">
          <li><NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Home</NavLink></li>
          <li><NavLink to="/all" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>All Listings</NavLink></li>
          <li><NavLink to="/create" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Add Listing</NavLink></li>
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