import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    // Save the attempted destination so /login can send them back after sign-in
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: 'Please log in to continue.',
        }}
      />
    )
  }

  return children
}

export default ProtectedRoute