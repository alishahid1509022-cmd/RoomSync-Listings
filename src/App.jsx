import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CreateItem from './pages/CreateItem'
import ViewAll from './pages/ViewAll'
import ViewSingle from './pages/ViewSingle'
import EditItem from './pages/EditItem'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-container">
        <Routes>
          {/* Public routes — anyone can browse */}
<Route path="/" element={<Home />} />
<Route path="/all" element={<ViewAll />} />
<Route path="/view/:id" element={<ViewSingle />} />

{/* Auth routes — for logged-out users */}
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/forgot-password" element={<ForgotPassword />} />

{/* Protected routes — must be logged in */}
<Route
  path="/create"
  element={
    <ProtectedRoute>
      <CreateItem />
    </ProtectedRoute>
  }
/>
<Route
  path="/edit/:id"
  element={
    <ProtectedRoute>
      <EditItem />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
        </Routes>
      </main>
    </div>
  )
}

export default App