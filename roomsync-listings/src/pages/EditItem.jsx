import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const EditItem = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    rent: '',
    roomType: 'Private',
    furnished: 'Furnished',
    description: '',
    contactName: '',
    contactPhone: '',
    imageUrl: ''
  })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  // Fetch the existing listing to pre-fill the form
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id)
        const snapshot = await getDoc(docRef)

        if (snapshot.exists()) {
          const data = snapshot.data()
          setFormData({
            title: data.title || '',
            location: data.location || '',
            rent: data.rent?.toString() || '',
            roomType: data.roomType || 'Private',
            furnished: data.furnished || 'Furnished',
            description: data.description || '',
            contactName: data.contactName || '',
            contactPhone: data.contactPhone || '',
            imageUrl: data.imageUrl || ''
          })
        } else {
          setNotFound(true)
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const docRef = doc(db, 'listings', id)
      await updateDoc(docRef, {
        ...formData,
        rent: Number(formData.rent),
        updatedAt: serverTimestamp()
      })

      // Navigate back to the detail page after update
      navigate(`/view/${id}`)
    } catch (err) {
      console.error('Error updating listing:', err)
      setError('Failed to update listing. Please try again.')
      setSubmitting(false)
    }
  }

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
        <Link to="/all" className="btn-secondary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          ← Back to all listings
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <Link to={`/view/${id}`} className="back-link">← Back to listing</Link>

      <h1 className="page-title">Edit Listing</h1>
      <p className="page-subtitle">Update your room's details below.</p>

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