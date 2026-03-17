import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Plus, Upload, Briefcase, MapPin, Clock, ChevronRight, X, FileText } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
//import { MOCK_JOBS } from '../api/mockData'
import { jobsApi } from '../api/client'

function SkillTag({ label }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60 rounded">
      {label}
    </span>
  )
}

function JDUploadZone({ onFile, jobId }) {
  const onDrop = useCallback(files => {
    if (files[0]) onFile(files[0], jobId)
  }, [onFile, jobId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
        ${isDragActive
          ? 'border-amber-500/60 bg-amber-500/5'
          : 'border-slate-700/60 hover:border-amber-500/30 hover:bg-slate-800/30'
        }
      `}
    >
      <input {...getInputProps()} />
      <Upload size={16} className="text-slate-500 mx-auto mb-1.5" />
      <p className="text-xs text-slate-400">Drop JD PDF here</p>
      <p className="text-[10px] text-slate-600 font-mono mt-0.5">.pdf or .txt</p>
    </div>
  )
}

function CreateJobModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    title: '', department: '', experience: '', location: 'Remote',
    description: '', requirements: ''
  })

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title.trim()) return toast.error('Job title is required')
    /*onCreate({
      id: 'job-' + Date.now(),
      ...form,
      requirements: form.requirements.split(',').map(s => s.trim()).filter(Boolean),
      status: 'active',
      candidate_count: 0,
      shortlisted_count: 0,
      created_at: new Date().toISOString().split('T')[0],
    })*/
    onCreate({
      ...form,
      requirements: form.requirements.split(',').map(s => s.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
      <div className="glass-card w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg text-white">New Job Board</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Job Title', key: 'title', placeholder: 'e.g. Senior Backend Engineer' },
            { label: 'Department', key: 'department', placeholder: 'e.g. Engineering' },
            { label: 'Experience Band', key: 'experience', placeholder: 'e.g. 3-5 years' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-mono text-slate-500 mb-1.5">{label}</label>
              <input
                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => handle(key, e.target.value)}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-1.5">Location</label>
            <select
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              value={form.location}
              onChange={e => handle('location', e.target.value)}
            >
              {['Remote', 'On-site', 'Hybrid'].map(o => (
                <option key={o} value={o} className="bg-slate-900">{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-1.5">Required Skills <span className="text-slate-700">(comma-separated)</span></label>
            <input
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              placeholder="Python, FastAPI, Docker, AWS"
              value={form.requirements}
              onChange={e => handle('requirements', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 mb-1.5">Job Description</label>
            <textarea
              rows={3}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder="Describe the role, responsibilities..."
              value={form.description}
              onChange={e => handle('description', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-700/60 text-slate-400 text-sm hover:border-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 py-2.5 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            Create Job
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JobBoard() {
  //const [jobs, setJobs] = useState(MOCK_JOBS)
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    jobsApi.list().then(r => setJobs(r.data))
  }, [])

  const [showCreate, setShowCreate] = useState(false)

  // const handleJDFile = (file, jobId) => {
  //   toast.success(`JD uploaded: ${file.name}`)
  //   // In real app: jobsApi.uploadJD(jobId, file)
  // }
  const handleJDFile = async (file, jobId) => {
    await jobsApi.uploadJD(jobId, file)
    toast.success(`JD uploaded: ${file.name}`)
  }

  /*const handleCreate = (job) => {
    setJobs(prev => [job, ...prev])
    toast.success('Job board created!')
  }*/
  const handleCreate = async (data) => {
    const { data: newJob } = await jobsApi.create(data)
    setJobs(prev => [newJob, ...prev])
    toast.success('Job board created!')
  }

  return (
    <div className="p-8 fade-in">
      <PageHeader
        title="Job Boards"
        subtitle="Manage job descriptions and requirements"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-slate-950 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Plus size={15} />
            New Job
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {jobs.map((job, i) => (
          <div key={job.id} className={`glass-card p-6 slide-up stagger-${(i % 4) + 1}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{job.title}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{job.department}</p>
                </div>
              </div>
              <StatusBadge status={job.status} />
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin size={11} className="text-slate-600" /> {job.location}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={11} className="text-slate-600" /> {job.experience}
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.requirements.map(r => <SkillTag key={r} label={r} />)}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between py-3 border-y border-slate-800/60 mb-4">
              <div className="text-center">
                <p className="font-mono text-lg font-medium text-white">{job.candidate_count}</p>
                <p className="text-[10px] text-slate-600 font-mono">Total</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-medium text-emerald-400">{job.shortlisted_count}</p>
                <p className="text-[10px] text-slate-600 font-mono">Shortlisted</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-medium text-slate-400">
                  {job.candidate_count > 0 ? Math.round(job.shortlisted_count / job.candidate_count * 100) : 0}%
                </p>
                <p className="text-[10px] text-slate-600 font-mono">Pass rate</p>
              </div>
            </div>

            {/* JD Upload */}
            <div className="mb-4">
              <p className="text-[10px] font-mono text-slate-600 mb-2 flex items-center gap-1.5">
                <FileText size={10} /> Upload / Replace JD Document
              </p>
              <JDUploadZone onFile={handleJDFile} jobId={job.id} />
            </div>

            {/* Action */}
            <button className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg text-sm text-slate-300 transition-colors border border-slate-700/30">
              <span className="font-medium">View candidates</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateJobModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
