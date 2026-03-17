import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Briefcase,
  CheckCircle2, XCircle, AlertCircle, Sparkles,
  ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { ScoreRing, ScoreBar } from '../components/ScoreBar'
//import { MOCK_CANDIDATES, MOCK_JOBS } from '../api/mockData'
import { candidatesApi, jobsApi } from '../api/client'

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-800/60">{children}</div>}
    </div>
  )
}

function SkillPill({ label, matched }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border
      ${matched
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        : 'bg-red-500/8 text-red-400 border-red-500/20'
      }
    `}>
      {matched
        ? <CheckCircle2 size={10} className="text-emerald-400" />
        : <XCircle size={10} className="text-red-400" />
      }
      {label}
    </span>
  )
}

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  //const candidate = MOCK_CANDIDATES.find(c => c.id === id)
  //const [status, setStatus] = useState(candidate?.status || 'pending')
  const [candidate, setCandidate] = useState(null)
  const [jobs, setJobs] = useState([])
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    candidatesApi.get(id).then(r => {
      setCandidate(r.data)
      setStatus(r.data.status)
      jobsApi.list().then(j => setJobs(j.data))
    })
  }, [id])

  if (!candidate) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Candidate not found</p>
          <button onClick={() => navigate('/candidates')} className="mt-3 text-amber-400 text-sm hover:underline">
            ← Back to pool
          </button>
        </div>
      </div>
    )
  }

  const job = jobs.find(j => j.id === candidate.job_id)

  /*const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    // In real app: candidatesApi.updateStatus(id, newStatus)
    toast.success(`Status updated to ${newStatus}`)
  }*/
  const handleStatusChange = async (newStatus) => {
    await candidatesApi.updateStatus(id, newStatus)
    setStatus(newStatus)
    toast.success(`Status updated to ${newStatus}`)
  }

  const matchedSkills = candidate.skills.filter(s =>
    job?.requirements.some(r => r.toLowerCase() === s.toLowerCase())
  )
  const missingSkills = job?.requirements.filter(r =>
    !candidate.skills.some(s => s.toLowerCase() === r.toLowerCase())
  ) || []

  return (
    <div className="p-8 fade-in">
      {/* Back */}
      <button
        onClick={() => navigate('/candidates')}
        className="flex items-center gap-2 text-slate-500 hover:text-amber-400 transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> Back to pool
      </button>

      {/* Hero header */}
      <div className="glass-card p-6 mb-6 slide-up stagger-1">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-xl text-amber-400">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl text-white">{candidate.name}</h1>
                <p className="text-slate-400 text-sm mt-1">{candidate.current_role}</p>
                <p className="text-slate-600 font-mono text-xs mt-1">{candidate.education}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={candidate.overall_score} size={80} />
              </div>
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/40 rounded-lg">
                {candidate.experience_years}y experience
              </span>
              <span className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/60 text-slate-400 border border-slate-700/40 rounded-lg">
                📄 {candidate.filename}
              </span>
              {job && (
                <span className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                  → {job.title}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Scores breakdown */}
          <Section title="Evaluation Scores" icon={TrendingUpIcon} defaultOpen>
            <div className="space-y-4 pt-4">
              {Object.entries(candidate.scores).map(([key, val], i) => (
                <ScoreBar
                  key={key}
                  label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  score={val}
                  delay={i * 80}
                />
              ))}
            </div>
          </Section>

          {/* AI Explanation */}
          <Section title="AI Explanation" icon={Sparkles} defaultOpen>
            <div className="pt-4">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30 mb-4">
                <p className="text-sm text-slate-300 leading-relaxed font-body">
                  {candidate.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div>
                  <p className="text-xs font-mono text-emerald-400/80 mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {candidate.strengths.map(s => (
                      <li key={s} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div>
                  <p className="text-xs font-mono text-orange-400/80 mb-2.5 flex items-center gap-1.5">
                    <AlertCircle size={11} /> Gaps
                  </p>
                  <ul className="space-y-1.5">
                    {candidate.gaps.map(g => (
                      <li key={g} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* Skills coverage */}
          <Section title="Skills Coverage" icon={FileText} defaultOpen>
            <div className="pt-4">
              {job && (
                <>
                  <p className="text-[10px] font-mono text-slate-600 mb-3 uppercase tracking-widest">
                    Required by JD — {matchedSkills.length}/{job.requirements.length} matched
                  </p>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {job.requirements.map(r => (
                      <SkillPill
                        key={r}
                        label={r}
                        matched={candidate.skills.some(s => s.toLowerCase() === r.toLowerCase())}
                      />
                    ))}
                  </div>
                </>
              )}

              <p className="text-[10px] font-mono text-slate-600 mb-3 uppercase tracking-widest">
                Candidate's Full Skill Set
              </p>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map(s => (
                  <span
                    key={s}
                    className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/60 text-slate-300 border border-slate-700/40 rounded"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* Right column: actions */}
        <div className="space-y-5">
          {/* Status control */}
          <div className="glass-card p-5 slide-up stagger-2">
            <p className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-widest">Decision</p>
            <div className="mb-4">
              <StatusBadge status={status} />
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleStatusChange('shortlisted')}
                disabled={status === 'shortlisted'}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  status === 'shortlisted'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default'
                    : 'border-emerald-500/20 text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 size={15} />
                Shortlist Candidate
              </button>

              <button
                onClick={() => handleStatusChange('rejected')}
                disabled={status === 'rejected'}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  status === 'rejected'
                    ? 'bg-red-500/15 text-red-400 border-red-500/30 cursor-default'
                    : 'border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
                }`}
              >
                <XCircle size={15} />
                Reject Candidate
              </button>

              <button
                onClick={() => handleStatusChange('pending')}
                disabled={status === 'pending'}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border border-slate-700/40 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 disabled:opacity-40 disabled:cursor-default"
              >
                Reset to Pending
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass-card p-5 slide-up stagger-3">
            <p className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-widest">Quick Stats</p>
            <div className="space-y-3">
              {[
                { label: 'Overall Score',   value: `${candidate.overall_score} / 100`,   color: 'text-white' },
                { label: 'Experience',      value: `${candidate.experience_years} years`, color: 'text-slate-300' },
                { label: 'Skills matched',  value: `${matchedSkills.length} / ${job?.requirements.length || '—'}`, color: 'text-emerald-400' },
                { label: 'Skills missing',  value: missingSkills.length,                  color: missingSkills.length > 0 ? 'text-red-400' : 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                  <span className="text-xs text-slate-500 font-mono">{label}</span>
                  <span className={`text-xs font-mono font-medium ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Applied for */}
          {job && (
            <div className="glass-card p-5 slide-up stagger-4">
              <p className="text-xs font-mono text-slate-500 mb-3 uppercase tracking-widest">Evaluated For</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Briefcase size={13} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{job.title}</p>
                  <p className="text-[11px] font-mono text-slate-500">{job.department} · {job.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// inline icon to avoid import issue
function TrendingUpIcon({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}
