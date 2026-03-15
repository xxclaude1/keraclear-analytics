import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LiveVisitors from './pages/LiveVisitors'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import SessionReplay from './pages/SessionReplay'
import Funnels from './pages/Funnels'
import Abandonment from './pages/Abandonment'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LiveVisitors />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionReplay />} />
          <Route path="funnels" element={<Funnels />} />
          <Route path="abandonment" element={<Abandonment />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
