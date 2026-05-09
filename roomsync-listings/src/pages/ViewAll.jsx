import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase/config'

const ViewAll = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch listings when component mounts
  useEffect(() => {
    const fetchListings = async () => {
      try {
        // Build a query: get all listings, newest first
        const listingsRef = collection(db, 'listings')
        const q = query(listingsRef, orderBy('createdAt', 'desc'))

        // Execute the query
        const snapshot = await getDocs(q)

        // Convert each document to a plain object with its ID
        const listingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setListings(listingsData)
      } catch (err) {
        console.error('Error fetching listings:', err)
        setError('Failed to load listings.')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])  // Empty dependency array = run once on mount

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">All Listings</h1>
        <p className="page-subtitle">Loading listings...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <h1 className="page-title">All Listings</h1>
        <div className="alert-error">{error}</div>
      </div>
    )
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">All Listings</h1>
        <p className="page-subtitle">No listings yet. Be the first to add one!</p>
        <Link to="/create" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          + Add Listing
        </Link>
      </div>
    )
  }

  // Success state — show grid of cards
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Listings</h1>
          <p className="page-subtitle">{listings.length} room{listings.length !== 1 ? 's' : ''} available</p>
        </div>
        <Link to="/create" className="btn-primary">
          + Add Listing
        </Link>
      </div>

      <div className="card-grid">
        {listings.map(listing => (
          <Link to={`/view/${listing.id}`} key={listing.id} className="listing-card">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} className="card-image" />
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
                <span className="card-rent">PKR {listing.rent?.toLocaleString()}/mo</span>
                <span className="card-link">View →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default ViewAll