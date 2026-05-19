import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getListingById, deleteListing } from '../services/listings'

// ViewSingle — the detail page for a single listing.
//
// Step 5 changes:
//   1. Firestore calls now go through services/listings.js.
//   2. Edit/Delete buttons show for the OWNER or ANY ADMIN (admin override).
//   3. Small visual hint when an admin sees buttons they have via override
//      (so admins don't get confused why they can edit a stranger's listing).
const ViewSingle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Two-part permission check:
  //   isOwner — you created this listing
  //   isAdmin — comes from AuthContext, you have role="admin"
  // Either one grants edit/delete privileges.
  const isOwner = currentUser && listing?.createdBy?.uid === currentUser.uid
  const canModify = isOwner || isAdmin
  const isAdminOverride = isAdmin && !isOwner

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await getListingById(id)
        if (data) {
          setListing(data)
        } else {
          setError('Listing not found.')
        }
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to load listing.')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  // Delete handler — only callable from the Delete button, which only shows
  // for owners or admins. Firestore rules enforce this server-side too.
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${listing.title}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteListing(id)
      navigate('/all')
    } catch (err) {
      console.error('Error deleting listing:', err)
      setError('Failed to delete listing.')
      setDeleting(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="page">
        <p className="page-subtitle">Loading listing...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-error">{error}</div>
        <Link
          to="/all"
          className="btn-secondary"
          style={{ display: 'inline-block', marginTop: '1rem' }}
        >
          ← Back to all listings
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/all" className="back-link">
        ← Back to all listings
      </Link>

      <article className="detail-card">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="detail-image"
          />
        ) : (
          <div className="detail-image-placeholder">🏠</div>
        )}

        <div className="detail-body">
          <div className="detail-header">
            <div>
              <h1 className="detail-title">{listing.title}</h1>
              <p className="detail-location">📍 {listing.location}</p>
            </div>
            <div className="detail-rent">
              PKR {listing.rent?.toLocaleString()}
              <span className="detail-rent-label">/ month</span>
            </div>
          </div>

          <div className="detail-tags">
            <span className="card-tag">{listing.roomType}</span>
            <span className="card-tag">{listing.furnished}</span>
          </div>

          <div className="detail-section">
            <h2 className="detail-section-title">Description</h2>
            <p className="detail-text">{listing.description}</p>
          </div>

          <div className="detail-section">
            <h2 className="detail-section-title">Contact Information</h2>
            <div className="detail-contact">
              <p>
                <strong>Name:</strong> {listing.contactName}
              </p>
              <p>
                <strong>Phone:</strong>{' '}
                <a href={`tel:${listing.contactPhone}`}>{listing.contactPhone}</a>
              </p>
            </div>
          </div>

          {/* Posted-by line */}
          {listing.createdBy && (
            <p className="listing-poster">
              Posted by <strong>{listing.createdBy.displayName}</strong>{' '}
              <span className="poster-email">({listing.createdBy.email})</span>
            </p>
          )}

          <p className="detail-meta">Listed on {formatDate(listing.createdAt)}</p>

          {/* Edit/Delete buttons — show for owner OR admin.
              Real enforcement is Firestore security rules (Step 7). */}
          {canModify && (
            <>
              {isAdminOverride && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    color: '#92400e',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    marginTop: '1rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  🛡️ Admin actions available — this listing belongs to{' '}
                  <strong>
                    {listing.createdBy?.displayName || 'another user'}
                  </strong>
                  .
                </div>
              )}
              <div className="detail-actions">
                <Link to={`/edit/${listing.id}`} className="btn-primary">
                  ✏️ Edit Listing
                </Link>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : '🗑️ Delete Listing'}
                </button>
              </div>
            </>
          )}
        </div>
      </article>
    </div>
  )
}

export default ViewSingle