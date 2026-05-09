import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const CreateItem = () => {
  // State for each form field
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

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Update state when any field changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Reference to the "listings" collection
      const listingsRef = collection(db, 'listings')

      // Add a new document with form data
      await addDoc(listingsRef, {
        ...formData,
        rent: Number(formData.rent),  // Convert string to number
        createdAt: serverTimestamp()
      })

      // After saving, navigate to the All Listings page
      navigate('/all')
    } catch (err) {
      console.error('Error adding listing:', err)
      setError('Failed to save listing. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Add a Listing</h1>
      <p className="page-subtitle">Share your room with potential roommates.</p>

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
            placeholder="e.g., Spacious 1-Bed in Johar Town"
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
              placeholder="e.g., DHA Phase 5, Lahore"
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
              placeholder="35000"
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
            placeholder="Describe the room, amenities, and any preferences..."
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
              placeholder="Your name"
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
              placeholder="+92-300-1234567"
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
            placeholder="https://example.com/room.jpg"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/all')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Add Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateItem