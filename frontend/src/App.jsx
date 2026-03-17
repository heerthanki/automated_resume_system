import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import JobBoard from './pages/JobBoard'
import CandidatePool from './pages/CandidatePool'
import CandidateDetail from './pages/CandidateDetail'
import PipelineRun from './pages/PipelineRun'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/candidates" element={<CandidatePool />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/pipeline" element={<PipelineRun />} />
        </Routes>
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a2535',
            color: '#e2e8f0',
            border: '1px solid rgba(245,158,11,0.3)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
