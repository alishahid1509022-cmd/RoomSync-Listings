import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const ViewSingle = () => {
  const { id } = useParams()           // Read :id from URL
  const navigate = useNavigate()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch the single listing when component mounts (or id changes)
  useEffect(() => {
    const fetchListing = async () => {
      try {
        // Reference to ONE specific document by ID
        const docRef = doc(db, 'listings', id)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          setListing({ id: snapshot.id, ...snapshot.data() })
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
  }, [id])  // Re-run if URL id changes

  // Delete handler
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${listing.title}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const docRef = doc(db, 'listings', id)
      await deleteDoc(docRef)
      navigate('/all')  // Go back to list after deletion
    } catch (err) {
      console.error('Error deleting listing:', err)
      setError('Failed to delete listing.')
      setDeleting(false)
    }
  }

  // Format Firestore timestamp into a readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
        <Link to="/all" className="btn-secondary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          ← Back to all listings
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/all" className="back-link">← Back to all listings</Link>

      <article className="detail-card">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} className="detail-image" />
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
              <p><strong>Name:</strong> {listing.contactName}</p>
              <p><strong>Phone:</strong> <a href={`tel:${listing.contactPhone}`}>{listing.contactPhone}</a></p>
            </div>
          </div>

          <p className="detail-meta">Listed on {formatDate(listing.createdAt)}</p>

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
        </div>
      </article>
    </div>
  )
}

export default ViewSingle