import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'

const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    avgRent: 0,
    locations: 0
  })
  const [recentListings, setRecentListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const listingsRef = collection(db, 'listings')

        // Get all listings for stats
        const allSnapshot = await getDocs(listingsRef)
        const allListings = allSnapshot.docs.map(d => d.data())

        // Calculate stats
        const total = allListings.length
        const avgRent = total > 0
          ? Math.round(allListings.reduce((sum, l) => sum + (l.rent || 0), 0) / total)
          : 0
        const uniqueLocations = new Set(allListings.map(l => l.location)).size

        setStats({ total, avgRent, locations: uniqueLocations })

        // Get 3 most recent listings
        const recentQuery = query(
          listingsRef,
          orderBy('createdAt', 'desc'),
          limit(3)
        )
        const recentSnapshot = await getDocs(recentQuery)
        const recent = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setRecentListings(recent)
      } catch (err) {
        console.error('Error fetching home data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  return (
    <div className="home-page">
      {/* === HERO === */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🏠 RoomSync — Lahore</span>
          <h1 className="hero-title">
            Find your perfect <span className="hero-accent">room</span> in the city.
          </h1>
          <p className="hero-subtitle">
            Browse verified listings across Lahore, connect with potential roommates,
            and find a place that feels like home.
          </p>
          <div className="hero-actions">
            <Link to="/all" className="btn-primary btn-lg">
              Browse Listings
            </Link>
            <Link to="/create" className="btn-secondary btn-lg">
              + List Your Room
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card hero-card-1">
            <span className="hero-card-emoji">🏘️</span>
            <strong>DHA Phase 5</strong>
            <small>From PKR 35,000</small>
          </div>
          <div className="hero-card hero-card-2">
            <span className="hero-card-emoji">🌆</span>
            <strong>Gulberg</strong>
            <small>From PKR 25,000</small>
          </div>
          <div className="hero-card hero-card-3">
            <span className="hero-card-emoji">🏛️</span>
            <strong>Johar Town</strong>
            <small>From PKR 18,000</small>
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{loading ? '—' : stats.total}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-number">
            {loading ? '—' : `PKR ${stats.avgRent.toLocaleString()}`}
          </div>
          <div className="stat-label">Average Rent</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-number">{loading ? '—' : stats.locations}</div>
          <div className="stat-label">Locations Covered</div>
        </div>
      </section>

      {/* === RECENT LISTINGS === */}
      {recentListings.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recently Added</h2>
              <p className="section-subtitle">Fresh rooms, just listed.</p>
            </div>
            <Link to="/all" className="section-link">View all →</Link>
          </div>

          <div className="card-grid">
            {recentListings.map(listing => (
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
        </section>
      )}

      {/* === HOW IT WORKS === */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">How RoomSync Works</h2>
            <p className="section-subtitle">Three steps to your next home.</p>
          </div>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Browse</h3>
            <p className="step-text">
              Explore listings filtered by location, budget, and room type across Lahore.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Connect</h3>
            <p className="step-text">
              Reach out directly to listing owners using the contact details on each room.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Move In</h3>
            <p className="step-text">
              Visit, decide, and start your new chapter — without the usual hassle.
            </p>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="cta-section">
        <h2 className="cta-title">Got a room to share?</h2>
        <p className="cta-subtitle">
          Post your listing in under a minute and reach students and professionals across Lahore.
        </p>
        <Link to="/create" className="btn-primary btn-lg">
          Post a Listing
        </Link>
      </section>
    </div>
  )
}

export default Home