import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getListingById, updateListing } from '../services/listings'

// EditItem — pre-fills a form with an existing listing's data and saves edits.
//
// Step 5 changes:
//   1. Firestore calls now go through services/listings.js (centralization).
//   2. Access gate added: only the listing's creator OR an admin can edit.
//      Non-authorized users see a friendly "access denied" instead of the form.
//   3. Visual indicator when an admin is editing someone else's listing.
const EditItem = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    rent: '',
    roomType: 'Private',
    furnished: 'Furnished',
    description: '',
    contactName: '',
    contactPhone: '',
    imageUrl: '',
  })

  // Keep a copy of the original listing (especially createdBy) so we can
  // do the ownership check and show "editing X's listing" indicator.
  const [originalListing, setOriginalListing] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Fetch the existing listing to pre-fill the form
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listing = await getListingById(id)
        if (!listing) {
          setNotFound(true)
          return
        }
        setOriginalListing(listing)
        setFormData({
          title: listing.title || '',
          location: listing.location || '',
          rent: listing.rent?.toString() || '',
          roomType: listing.roomType || 'Private',
          furnished: listing.furnished || 'Furnished',
          description: listing.description || '',
          contactName: listing.contactName || '',
          contactPhone: listing.contactPhone || '',
          imageUrl: listing.imageUrl || '',
        })
      } catch (err) {
        console.error('Error fetching listing:', err)
        setError('Failed to load listing.')
      } finally {
        setLoading(false)
      }
    }

    fetchListing()
  }, [id])

  // Compute access permission AFTER originalListing is loaded.
  // Two-part check: are you the creator, OR are you an admin?
  // Either one grants edit access.
  const isOwner =
    currentUser && originalListing?.createdBy?.uid === currentUser.uid
  const canEdit = isOwner || isAdmin

  // True when an admin is editing a listing they didn't create.
  // Used purely for the "admin action" banner — no security implication.
  const isAdminOverride = isAdmin && !isOwner

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await updateListing(id, formData)
      navigate(`/view/${id}`)
    } catch (err) {
      console.error('Error updating listing:', err)
      setError('Failed to update listing. Please try again.')
      setSubmitting(false)
    }
  }

  // ── Render states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page">
        <p className="page-subtitle">Loading listing...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="page">
        <div className="alert-error">Listing not found.</div>
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

  // Access gate — runs BEFORE rendering the form.
  // This is UI enforcement; Firestore rules will reject the update server-side
  // even if someone bypasses this check (e.g. by editing the URL).
  if (!canEdit) {
    return (
      <div className="page">
        <div className="alert-error">
          You don't have permission to edit this listing. Only the creator or
          an admin can edit it.
        </div>
        <Link
          to={`/view/${id}`}
          className="btn-secondary"
          style={{ display: 'inline-block', marginTop: '1rem' }}
        >
          ← Back to listing
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to={`/view/${id}`} className="back-link">
        ← Back to listing
      </Link>

      <h1 className="page-title">Edit Listing</h1>
      <p className="page-subtitle">Update the room's details below.</p>

      {/* Admin override banner — tells the admin "you're editing someone else's
          listing" so they don't accidentally make changes thinking it's theirs. */}
      {isAdminOverride && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            color: '#92400e',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          🛡️ <strong>Admin action:</strong> You're editing a listing posted by{' '}
          <strong>{originalListing.createdBy?.displayName || 'another user'}</strong>.
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rent">Rent (PKR/month) *</label>
            <input
              type="number"
              id="rent"
              name="rent"
              value={formData.rent}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="roomType">Room Type</label>
            <select
              id="roomType"
              name="roomType"
              value={formData.roomType}
              onChange={handleChange}
            >
              <option value="Private">Private</option>
              <option value="Shared">Shared</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="furnished">Furnishing</label>
            <select
              id="furnished"
              name="furnished"
              value={formData.furnished}
              onChange={handleChange}
            >
              <option value="Furnished">Furnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contactName">Contact Name *</label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone *</label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL (optional)</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/view/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditItem