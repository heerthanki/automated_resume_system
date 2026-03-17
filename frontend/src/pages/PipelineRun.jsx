import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { Play, FolderOpen, ChevronDown, CheckCircle2, Clock, FileText } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AgentPipelineStatus from '../components/AgentPipelineStatus'
//import { MOCK_JOBS, MOCK_PIPELINE_RUNS } from '../api/mockData'
import { jobsApi, pipelineApi } from '../api/client'

// Simulates the agent pipeline progress for dev mode
function useMockPipeline() {
  const [agentStatus, setAgentStatus] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [log, setLog] = useState([])

  const AGENTS = [
    'jd_agent', 'resume_agent', 'matching_agent',
    'scoring_agent', 'explanation_agent', 'ranking_agent'
  ]

  const LOGS = [
    'Loaded JD: Senior Backend Engineer',
    'Extracted 12 required skills from JD',
    'Found 8 resume files in folder',
    'Parsing resume: arjun_mehta.pdf...',
    'Parsing resume: priya_sharma.pdf...',
    'Running semantic matching with sentence-transformers...',
    'Computing cosine similarity scores...',
    'Applying weighted scoring rubric...',
    'Generating explanations via LLM...',
    'Bias audit: no anomalies detected',
    'Ranking 8 candidates by composite score...',
    'Shortlisted 3 candidates (score ≥ 70)',
  ]

  const run = async () => {
    setIsRunning(true)
    setAgentStatus({})
    setLog([])

    for (let i = 0; i < AGENTS.length; i++) {
      const agent = AGENTS[i]
      setAgentStatus(prev => ({ ...prev, [agent]: 'running' }))
      addLog(LOGS[i * 2] || `Running ${agent}...`)

      await sleep(800 + Math.random() * 600)
      addLog(LOGS[i * 2 + 1] || `${agent} completed`)

      setAgentStatus(prev => ({ ...prev, [agent]: 'done' }))
      await sleep(200)
    }

    setIsRunning(false)
    toast.success('Pipeline complete! 3 candidates shortlisted.')
  }

  function addLog(msg) {
    setLog(prev => [...prev, { ts: new Date().toLocaleTimeString('en', { hour12: false }), msg }])
  }

  return { agentStatus, isRunning, log, run }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export default function PipelineRun() {
  //const [selectedJob, setSelectedJob] = useState(MOCK_JOBS[0].id)
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [pipelineHistory, setPipelineHistory] = useState([])

  useEffect(() => {
    jobsApi.list().then(r => {
      setJobs(r.data)
      if (r.data.length > 0) setSelectedJob(r.data[0].id)
    })
    pipelineApi.history().then(r => setPipelineHistory(r.data))
  }, [])

  const [folderPath, setFolderPath] = useState('C:\\HR_tool\\resumes')
  const [threshold, setThreshold] = useState(70)
  //const { agentStatus, isRunning, log, run } = useMockPipeline()
  const [agentStatus, setAgentStatus] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [log, setLog] = useState([])
  const logRef = useRef()

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  /*const handleRun = () => {
    if (!selectedJob) return toast.error('Select a job first')
    if (!folderPath.trim()) return toast.error('Enter a resume folder path')
    run()
  }*/
  const handleRun = async () => {
    if (!selectedJob) return toast.error('Select a job first')
    if (!folderPath.trim()) return toast.error('Enter a resume folder path')

    setIsRunning(true)
    setLog([])
    setAgentStatus({})

    try {
      //const { data } = await pipelineApi.run(selectedJob, folderPath)
      const { data } = await pipelineApi.run(selectedJob, folderPath, threshold)
      const runId = data.run_id

      // Poll status every 2 seconds
      const interval = setInterval(async () => {
        const { data: status } = await pipelineApi.status(runId)
        //setLog(status.log_lines || [])
        const formatted = (status.log_lines || []).map(msg => ({
          ts: new Date().toLocaleTimeString('en', { hour12: false }),
          msg
        }))
        setLog(formatted)
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(interval)
          setIsRunning(false)
          toast.success(`Pipeline complete! ${status.shortlisted} shortlisted.`)
          pipelineApi.history().then(r => setPipelineHistory(r.data))
        }
      }, 2000)
    } catch (e) {
      toast.error('Pipeline failed to start')
      setIsRunning(false)
    }
  }

  const selectedJobData = jobs.find(j => j.id === selectedJob)

  return (
    <div className="p-8 fade-in">
      <PageHeader
        title="Run Pipeline"
        subtitle="Process a folder of resumes against a job description"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-6 slide-up stagger-1">
            <h3 className="text-sm font-semibold text-white mb-5">Pipeline Configuration</h3>

            {/* Job selector */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-slate-500 mb-2">Target Job Board</label>
              <div className="relative">
                <select
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none"
                  value={selectedJob}
                  onChange={e => setSelectedJob(e.target.value)}
                >
                  {jobs.filter(j => j.status === 'active').map(j => (
                    <option key={j.id} value={j.id} className="bg-slate-900">{j.title}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Selected job preview */}
            {selectedJobData && (
              <div className="bg-slate-800/40 rounded-lg p-3 mb-4 border border-slate-700/30">
                <p className="text-xs font-mono text-slate-500 mb-2">Required skills</p>
                <div className="flex flex-wrap gap-1">
                  {selectedJobData.requirements.map(r => (
                    <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Folder path */}
            <div className="mb-4">
              <label className="block text-xs font-mono text-slate-500 mb-2">Resume Folder Path</label>
              <div className="relative">
                <FolderOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  placeholder="/path/to/resumes/"
                  value={folderPath}
                  onChange={e => setFolderPath(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-600 font-mono mt-1.5">
                Server-side path. PDF files will be auto-discovered.
              </p>
            </div>

            {/* Threshold */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-slate-500 mb-2">
                Shortlist Threshold — <span className="text-amber-400">{threshold}%</span>
              </label>
              <input
                type="range" min="40" max="90" step="5"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-700 mt-1">
                <span>40% (lenient)</span>
                <span>90% (strict)</span>
              </div>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`
                w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-semibold transition-all
                ${isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 amber-glow'
                }
              `}
            >
              {isRunning ? (
                <><span className="w-4 h-4 border-2 border-slate-500 border-t-slate-300 rounded-full spinner" />Running...</>
              ) : (
                <><Play size={15} fill="currentColor" />Start Pipeline</>
              )}
            </button>
          </div>

          {/* Past runs */}
          <div className="glass-card p-5 slide-up stagger-2">
            <h3 className="text-xs font-mono text-slate-500 mb-4 uppercase tracking-widest">Past Runs</h3>
            <div className="space-y-3">
              {pipelineHistory.map(run => (
                <div key={run.id} className="flex items-center gap-3 py-2 border-b border-slate-800/60 last:border-0">
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 font-medium truncate">{run.job_title}</p>
                    <p className="text-[10px] font-mono text-slate-600">{run.total_resumes} resumes · {run.shortlisted} shortlisted</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{run.started_at.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: live status + log */}
        <div className="lg:col-span-3 space-y-5">
          {/* Agent pipeline */}
          <div className="glass-card p-6 slide-up stagger-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Agent Pipeline</h3>
              {isRunning && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 agent-pulse" />
                  <span className="text-xs text-amber-400 font-mono">Live</span>
                </div>
              )}
            </div>
            <AgentPipelineStatus agentStatus={agentStatus} />
          </div>

          {/* Log terminal */}
          <div className="glass-card p-5 slide-up stagger-3">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={13} className="text-slate-600" />
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest">Agent Log</h3>
            </div>
            <div
              ref={logRef}
              className="h-56 overflow-y-auto bg-slate-950/60 rounded-lg p-4 font-mono text-xs space-y-1.5 border border-slate-800/60"
            >
              {log.length === 0 ? (
                <p className="text-slate-700">Waiting to start...</p>
              ) : log.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-700 flex-shrink-0">{entry.ts}</span>
                  <span className="text-emerald-400/80">{entry.msg}</span>
                </div>
              ))}
              {isRunning && (
                <div className="flex gap-3">
                  <span className="text-slate-700">—</span>
                  <span className="text-amber-400 animate-pulse">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
