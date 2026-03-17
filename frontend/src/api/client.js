import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Jobs 
export const jobsApi = {
  list: ()                  => api.get('/jobs'),
  get:  (id)                => api.get(`/jobs/${id}`),
  create: (data)            => api.post('/jobs', data),
  delete: (id)              => api.delete(`/jobs/${id}`),
  uploadJD: (id, file)      => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/jobs/${id}/upload-jd`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ── Candidates 
export const candidatesApi = {
  list: (jobId) => api.get('/candidates', { params: jobId ? { job_id: jobId } : {} }),
  get:        (id)          => api.get(`/candidates/${id}`),
  updateStatus: (id, status) => api.patch(`/candidates/${id}/status`, { status }),
}

// ── Pipeline 
export const pipelineApi = {
  //run: (jobId, folderPath)  => api.post('/pipeline/run', { job_id: jobId, folder_path: folderPath }),
  run: (jobId, folderPath, threshold) => api.post('/pipeline/run', { job_id: jobId, folder_path: folderPath, threshold }),
  status: (runId)           => api.get(`/pipeline/status/${runId}`),
  history: ()               => api.get('/pipeline/history'),
}

// ── Dashboard ─────────────────────────────────────────
export const dashboardApi = {
  stats: ()                 => api.get('/dashboard/stats'),
}

export default api
