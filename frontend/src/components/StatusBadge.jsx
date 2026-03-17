import clsx from 'clsx'

const variants = {
  shortlisted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  rejected:    'bg-red-500/10 text-red-400 border-red-500/25',
  pending:     'bg-slate-700/50 text-slate-400 border-slate-600/40',
  processing:  'bg-amber-500/10 text-amber-400 border-amber-500/25',
  active:      'bg-blue-500/10 text-blue-400 border-blue-500/25',
  closed:      'bg-slate-700/40 text-slate-500 border-slate-600/30',
}

const dots = {
  shortlisted: 'bg-emerald-400',
  rejected:    'bg-red-400',
  pending:     'bg-slate-500',
  processing:  'bg-amber-400 agent-pulse',
  active:      'bg-blue-400',
  closed:      'bg-slate-600',
}

export default function StatusBadge({ status, pulse = false }) {
  const key = status?.toLowerCase() || 'pending'
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border',
      variants[key] || variants.pending
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', dots[key] || dots.pending, pulse && 'agent-pulse')} />
      {status || 'Pending'}
    </span>
  )
}
