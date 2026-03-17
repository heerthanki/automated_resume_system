# AI Recruitment System UI

React frontend for the Multi-Agent Recruitment Pipeline.
Dark industrial design. Connects to FastAPI backend.

---

## Project Structure

```
recruitment-ui/
├── src/
│   ├── api/
│   │   ├── client.js        
│   │   └── mockData.js      
│   ├── components/
│   │   ├── Sidebar.jsx           
│   │   ├── PageHeader.jsx        
│   │   ├── StatusBadge.jsx       
│   │   ├── ScoreBar.jsx          
│   │   └── AgentPipelineStatus.jsx 
│   ├── pages/
│   │   ├── Dashboard.jsx    
│   │   ├── JobBoard.jsx     
│   │   ├── PipelineRun.jsx  
│   │   ├── CandidatePool.jsx 
│   │   └── CandidateDetail.jsx 
│   ├── App.jsx              
│   ├── main.jsx             
│   └── index.css            
├── index.html
├── vite.config.js           
├── tailwind.config.js
└── package.json
```

---

## Quick Start

### 1. Prerequisites
```bash
node >= 18
npm >= 9
```

### 2. Install dependencies
```bash
cd recruitment-ui
npm install
```

### 3. Run in development (mock data, no backend needed)
```bash
npm run dev
# → http://localhost:3000
```

The UI runs fully on mock data by default. All 5 pages work
without any backend connection.

### 4. Run with FastAPI backend
Ensure FastAPI is running on port 8000:
```bash
# In your FastAPI project:
uvicorn main:app --reload --port 8000
```

Then in `src/pages/*.jsx`, replace mock data imports with real API calls:
```js

// After (real):
import { candidatesApi } from '../api/client'
const { data } = await candidatesApi.list(jobId)
```

Vite auto-proxies `/api/*` → `http://localhost:8000`.

### 5. Production build
```bash
npm run build
# Output in /dist — serve with nginx or FastAPI StaticFiles
```

---

## Pages & Features

| Page | Route | What it does |
|------|-------|-------------|
| Dashboard | `/dashboard` | Stats, activity chart, job overview |
| Job Board | `/jobs` | Create JDs, upload JD PDF, view requirements |
| Run Pipeline | `/pipeline` | Select job + folder path, trigger agents, live log |
| Candidate Pool | `/candidates` | Filter by status/job, sort by score, search |
| Candidate Detail | `/candidates/:id` | Full scores, AI explanation, skills gap, decision |

---

## API Contract (FastAPI expected endpoints)

```
GET  /api/dashboard/stats
GET  /api/jobs
POST /api/jobs
POST /api/jobs/:id/upload-jd      (multipart/form-data)
GET  /api/candidates?job_id=xxx
GET  /api/candidates/:id
PATCH /api/candidates/:id/status  { status: "shortlisted"|"rejected"|"pending" }
POST /api/pipeline/run            { job_id, folder_path }
GET  /api/pipeline/status/:run_id
GET  /api/pipeline/history
```

---

## Connecting Live Pipeline Status (SSE / Polling)

In `PipelineRun.jsx`, replace `useMockPipeline` hook with real polling:

```js
// Poll pipeline status every 1.5s
const pollStatus = async (runId) => {
  const interval = setInterval(async () => {
    const { data } = await pipelineApi.status(runId)
    setAgentStatus(data.agent_status)  // { jd_agent: 'done', resume_agent: 'running', ... }
    setLog(data.log_lines)
    if (data.status === 'completed' || data.status === 'error') {
      clearInterval(interval)
      setIsRunning(false)
    }
  }, 1500)
}
```

Or use SSE (Server-Sent Events) from FastAPI:
```js
const es = new EventSource(`/api/pipeline/stream/${runId}`)
es.onmessage = (e) => {
  const event = JSON.parse(e.data)
  setAgentStatus(prev => ({ ...prev, [event.agent]: event.status }))
}
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3 | UI framework |
| react-router-dom | 6.x | Client-side routing |
| axios | 1.7 | HTTP client |
| recharts | 2.12 | Dashboard bar chart |
| react-dropzone | 14.x | JD file upload zone |
| react-hot-toast | 2.4 | Toast notifications |
| lucide-react | 0.441 | Icon set |
| tailwindcss | 3.4 | Utility CSS |
| clsx | 2.x | Conditional classnames |

---

## Environment Variables (optional)

Create `.env` at project root:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Then in `src/api/client.js`:
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
})
```

---

4. MongoDB storage for candidates + scores
5. Redis for pipeline run state / job queue

# Backend part
pip install -r requirements.txt
