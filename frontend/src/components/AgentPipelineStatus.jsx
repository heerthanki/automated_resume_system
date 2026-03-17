import clsx from 'clsx'
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react'

const AGENTS = [
  { key: 'jd_agent',          label: 'JD Agent',          desc: 'Parsing job requirements' },
  { key: 'resume_agent',      label: 'Resume Agent',      desc: 'Extracting candidate data' },
  { key: 'matching_agent',    label: 'Matching Agent',    desc: 'Semantic similarity scoring' },
  { key: 'scoring_agent',     label: 'Scoring Agent',     desc: 'Weighted evaluation' },
  { key: 'explanation_agent', label: 'Explanation Agent', desc: 'Generating insights' },
  { key: 'ranking_agent',     label: 'Ranking Agent',     desc: 'Sorting shortlist' },
]

function AgentIcon({ status }) {
  if (status === 'done')       return <CheckCircle2 size={15} className="text-emerald-400" />
  if (status === 'running')    return <Loader2 size={15} className="text-amber-400 spinner" />
  if (status === 'error')      return <AlertCircle size={15} className="text-red-400" />
  return <Circle size={15} className="text-slate-700" />
}

export default function AgentPipelineStatus({ agentStatus = {} }) {
  return (
    <div className="space-y-1">
      {AGENTS.map((agent, i) => {
        const status = agentStatus[agent.key] || 'idle'
        const isRunning = status === 'running'
        const isDone = status === 'done'

        return (
          <div key={agent.key} className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300',
            isRunning ? 'bg-amber-500/5 border-amber-500/20' :
            isDone    ? 'bg-emerald-500/5 border-emerald-500/15' :
            status === 'error' ? 'bg-red-500/5 border-red-500/20' :
            'border-transparent'
          )}>
            <AgentIcon status={status} />
            <div className="flex-1 min-w-0">
              <p className={clsx(
                'text-xs font-medium leading-tight',
                isRunning ? 'text-amber-300' :
                isDone    ? 'text-emerald-300' :
                'text-slate-500'
              )}>
                {agent.label}
              </p>
              {(isRunning || isDone) && (
                <p className="text-[10px] text-slate-600 font-mono truncate">{agent.desc}</p>
              )}
            </div>
            <span className={clsx(
              'font-mono text-[10px]',
              isRunning ? 'text-amber-500' :
              isDone    ? 'text-emerald-500/70' :
              'text-slate-700'
            )}>
              {status === 'idle' ? `0${i+1}` : status.toUpperCase()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
