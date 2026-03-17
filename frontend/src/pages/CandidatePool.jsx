import { useState, useMemo, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, ChevronRight, ArrowUpDown,
  Users, TrendingUp, CheckCircle2, XCircle
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { ScoreRing } from '../components/ScoreBar'
//import { MOCK_CANDIDATES, MOCK_JOBS } from '../api/mockData'
import { candidatesApi, jobsApi } from '../api/client'

const STATUS_FILTERS = ['All', 'Shortlisted', 'Pending', 'Rejected']
const SORT_OPTIONS = [
  { label: 'Score ↓',   key: 'overall_score',   dir: -1 },
  { label: 'Score ↑',   key: 'overall_score',   dir:  1 },
  { label: 'Name A–Z',  key: 'name',            dir:  1 },
  { label: 'Experience',key: 'experience_years', dir: -1 },
]

function StatPill({ icon: Icon, label, value, color = 'text-slate-400' }) {
  return (
    <div className="glass-card px-4 py-3 flex items-center gap-3">
      <Icon size={15} className={color} />
      <div>
        <p className={`font-mono text-xl font-medium ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-600 font-mono">{label}</p>
      </div>
    </div>
  )
}

export default function CandidatePool() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [jobFilter, setJobFilter] = useState('all')
  const [sortIdx, setSortIdx] = useState(0)

  const sort = SORT_OPTIONS[sortIdx]

  const filtered = useMemo(() => {
    return allCandidates
      .filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.current_role.toLowerCase().includes(search.toLowerCase()) ||
          c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
        const matchStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase()
        const matchJob = jobFilter === 'all' || c.job_id === jobFilter
        return matchSearch && matchStatus && matchJob
      })
      .sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key]
        return typeof av === 'string'
          ? sort.dir * av.localeCompare(bv)
          : sort.dir * (bv - av)
      })
  }, [search, statusFilter, jobFilter, sortIdx])

  /*const counts = useMemo(() => ({
    all: MOCK_CANDIDATES.length,
    shortlisted: MOCK_CANDIDATES.filter(c => c.status === 'shortlisted').length,
    pending: MOCK_CANDIDATES.filter(c => c.status === 'pending').length,
    rejected: MOCK_CANDIDATES.filter(c => c.status === 'rejected').length,
  }), [])*/
  const [allCandidates, setAllCandidates] = useState([])
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    candidatesApi.list().then(r => setAllCandidates(r.data))
    jobsApi.list().then(r => setJobs(r.data))
  }, [])

  const counts = useMemo(() => ({
    all: allCandidates.length,
    shortlisted: allCandidates.filter(c => c.status === 'shortlisted').length,
    pending: allCandidates.filter(c => c.status === 'pending').length,
    rejected: allCandidates.filter(c => c.status === 'rejected').length,
  }), [allCandidates])

  return (
    <div className="p-8 fade-in">
      <PageHeader
        title="Candidate Pool"
        subtitle="All evaluated candidates across pipeline runs"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <StatPill icon={Users}      label="Total"       value={counts.all}         color="text-slate-300" />
        <StatPill icon={CheckCircle2} label="Shortlisted" value={counts.shortlisted} color="text-emerald-400" />
        <StatPill icon={TrendingUp} label="Pending"     value={counts.pending}     color="text-amber-400" />
        <StatPill icon={XCircle}    label="Rejected"    value={counts.rejected}    color="text-red-400" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-800/60 border border-slate-700/40 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40"
            placeholder="Search name, role, skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => navigate(`/candidates/${c.id}`)}
              className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                statusFilter === s
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Job filter */}
        <select
          className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2 text-xs font-mono text-slate-400 focus:outline-none focus:border-amber-500/40"
          value={jobFilter}
          onChange={e => setJobFilter(e.target.value)}
        >
          <option value="all" className="bg-slate-900">All Jobs</option>
          {jobs.map(j => (
            <option key={j.id} value={j.id} className="bg-slate-900">{j.title}</option>
          ))}
        </select>

        {/* Sort */}
        <button
          onClick={() => setSortIdx(i => (i + 1) % SORT_OPTIONS.length)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowUpDown size={12} />
          {sort.label}
        </button>
      </div>

      {/* Candidate table */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800/60 text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          <div className="col-span-1">Score</div>
          <div className="col-span-4">Candidate</div>
          <div className="col-span-3">Current Role</div>
          <div className="col-span-2">Skills match</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600">
            <Filter size={28} className="mb-3 opacity-40" />
            <p className="text-sm">No candidates match your filters</p>
          </div>
        ) : (
          filtered.map((c, i) => {
            const job = jobs.find(j => j.id === c.job_id)
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/candidates/${c.id}`)}
                className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 cursor-pointer transition-colors group items-center"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Score ring */}
                <div className="col-span-1 flex justify-center">
                  <ScoreRing score={c.overall_score} size={52} />
                </div>

                {/* Name + meta */}
                <div className="col-span-4">
                  <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.education}</p>
                  {job && (
                    <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                      → {job.title}
                    </p>
                  )}
                </div>

                {/* Current role */}
                <div className="col-span-3">
                  <p className="text-xs text-slate-300">{c.current_role.split(' at ')[0]}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    at {c.current_role.split(' at ')[1]} · {c.experience_years}y exp
                  </p>
                </div>

                {/* Skills match bar */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-600">Skills</span>
                    <span className="text-[10px] font-mono text-slate-400">{c.scores.skills_match}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.scores.skills_match >= 80 ? 'bg-emerald-400' :
                        c.scores.skills_match >= 60 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${c.scores.skills_match}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={c.status} />
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-end">
                  <ChevronRight size={14} className="text-slate-700 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer count */}
      <p className="text-xs font-mono text-slate-600 mt-3 text-right">
        Showing {filtered.length} of {allCandidates.length} candidates
      </p>
    </div>
  )
}
