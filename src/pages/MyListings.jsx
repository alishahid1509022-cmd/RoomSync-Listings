import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getListingsByUser, deleteListing } from '../services/listings'

// MyListings — the User Dashboard.
// Shows every listing the currently logged-in user has created,
// with inline Edit and Delete actions. Any logged-in user can see
// this page (it's not admin-only); the page just shows them THEIR
// stuff, never anyone else's.
const MyListings = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Track which row is currently being deleted, so we can show a
  // "Deleting..." state and disable the button to prevent double-clicks.
  const [deletingId, setDeletingId] = useState(null)

  // Fetch on mount + whenever the user changes (e.g. they log out and back in
  // as someone else without a hard refresh).
  useEffect(() => {
    if (!currentUser) return
    const fetchMine = async () => {
      try {
        setLoading(true)
        const mine = await getListingsByUser(currentUser.uid)
        setListings(mine)
      } catch (err) {
        console.error('Error fetching your listings:', err)
        setError('Failed to load your listings.')
      } finally {
        setLoading(false)
      }
    }
    fetchMine()
  }, [currentUser])

  // Delete handler — confirms, deletes via the service, then removes from local
  // state so the card disappears without us re-fetching the whole list.
  const handleDelete = async (id, title) => {
    const ok = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!ok) return

    try {
      setDeletingId(id)
      await deleteListing(id)
      // Remove from local state instead of refetching — faster, no flicker.
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      console.error('Error deleting listing:', err)
      alert('Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">My Listings</h1>
        <p className="page-subtitle">Loading your listings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">My Listings</h1>
        <div className="alert-error">{error}</div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">My Listings</h1>
        <p className="page-subtitle">
          You haven't posted any listings yet. Got a room to share?
        </p>
        <Link
          to="/create"
          className="btn-primary"
          style={{ display: 'inline-block', marginTop: '1rem' }}
        >
          + Add Your First Listing
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Listings</h1>
          <p className="page-subtitle">
            {listings.length} listing{listings.length !== 1 ? 's' : ''} posted by you
          </p>
        </div>
        <Link to="/create" className="btn-primary">
          + Add Listing
        </Link>
      </div>

      <div className="card-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="listing-card">
            {/* The clickable image + body sends you to the full view page */}
            <Link
              to={`/view/${listing.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="card-image"
                />
              ) : (
                <div className="card-image-placeholder">🏠</div>
              )}
              <div className="card-body">
                <h3 className="card-title">{listing.title}</h3>
                <p className="card-location">📍 {listing.location}</p>
                <div className="card-meta">
                  <span className="card-tag">{listing.roomType}</span>
                  <span className="card-tag">{listing.furnished}</span>
                </div>
                <div className="card-footer">
                  <span className="card-rent">
                    PKR {listing.rent?.toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </Link>

            {/* Action row — Edit + Delete, sits below the card content */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderTop: '1px solid #e5e7eb',
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/edit/${listing.id}`)}
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={() => handleDelete(listing.id, listing.title)}
                disabled={deletingId === listing.id}
              >
                {deletingId === listing.id ? 'Deleting...' : '🗑 Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyListings