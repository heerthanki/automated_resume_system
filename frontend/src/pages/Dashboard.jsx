import { useState, useEffect } from 'react'
import {
  Users, Briefcase, TrendingUp, GitBranch,
  ArrowUpRight, Clock
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
//import { MOCK_STATS, MOCK_JOBS, MOCK_CANDIDATES } from '../api/mockData'
import { dashboardApi, jobsApi, candidatesApi } from '../api/client'

function StatCard({ icon: Icon, label, value, sub, delay = 0 }) {
  return (
    <div className={`glass-card p-5 slide-up stagger-${delay}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon size={16} className="text-amber-400" />
        </div>
        <ArrowUpRight size={14} className="text-slate-600" />
      </div>
      <p className="font-mono text-3xl font-medium text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5 font-mono">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs font-mono">
        <p className="text-slate-400">{label}</p>
        <p className="text-amber-400 font-medium">{payload[0].value} processed</p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  // const stats = MOCK_STATS
  // const recentCandidates = MOCK_CANDIDATES.slice(0, 4)
  const [stats, setStats] = useState(null)
  const [recentCandidates, setRecentCandidates] = useState([])
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    dashboardApi.stats().then(r => setStats(r.data))
    candidatesApi.list().then(r => setRecentCandidates(r.data.slice(0, 4)))
    jobsApi.list().then(r => setJobs(r.data))
  }, [])

  if (!stats) return <div className="p-8 text-slate-500 font-mono">Loading...</div>
  
  return (
    <div className="p-8 fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="AI recruitment pipeline overview"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Briefcase}   label="Active Jobs"      value={stats.total_jobs}       sub="Across departments"  delay={1} />
        <StatCard icon={Users}       label="Total Candidates" value={stats.total_candidates}  sub="All pipeline runs"   delay={2} />
        <StatCard icon={TrendingUp}  label="Shortlisted"      value={stats.shortlisted}       sub={`${Math.round(stats.shortlisted/stats.total_candidates*100)}% pass rate`} delay={3} />
        <StatCard icon={GitBranch}   label="Pipeline Runs"    value={stats.pipeline_runs}     sub={"Avg score: " + stats.avg_score} delay={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Activity Chart */}
        {/* <div className="glass-card p-6 lg:col-span-2 slide-up stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Processing Activity</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Resumes processed per day</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.recent_activity} barSize={32}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={false} tickLine={false} width={24}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.04)' }} />
              <Bar dataKey="processed" radius={[4,4,0,0]}>
                {stats.recent_activity.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? '#f59e0b' : '#1e3a52'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div> */}

        {/* Recent Candidates */}
        <div className="glass-card p-6 slide-up stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Recent Candidates</h3>
            <Clock size={13} className="text-slate-600" />
          </div>
          <div className="space-y-3">
            {recentCandidates.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 font-medium truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{c.current_role.split(' at ')[1]}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className="font-mono text-sm text-white">{c.overall_score}</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Overview */}
      <div className="glass-card p-6 mt-6 slide-up stagger-4">
        <h3 className="text-sm font-semibold text-white mb-5">Active Job Boards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 hover:border-amber-500/20 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                <StatusBadge status={job.status} />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{job.title}</p>
              <p className="text-xs text-slate-500 font-mono mb-3">{job.department}</p>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{job.candidate_count} candidates</span>
                <span className="text-emerald-400">{job.shortlisted_count} shortlisted</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
