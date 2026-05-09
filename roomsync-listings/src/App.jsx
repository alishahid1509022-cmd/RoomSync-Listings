import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import CreateItem from './pages/CreateItem'
import ViewAll from './pages/ViewAll'
import ViewSingle from './pages/ViewSingle'
import EditItem from './pages/EditItem'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateItem />} />
          <Route path="/all" element={<ViewAll />} />
          <Route path="/view/:id" element={<ViewSingle />} />
          <Route path="/edit/:id" element={<EditItem />} />
        </Routes>
      </main>
    </div>
  )
}

export default App