import { useEffect, useState } from 'react'
import clsx from 'clsx'

function scoreColor(score) {
  if (score >= 80) return 'bg-emerald-400'
  if (score >= 60) return 'bg-amber-400'
  if (score >= 40) return 'bg-orange-400'
  return 'bg-red-400'
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Low'
}

export function ScoreBar({ label, score, delay = 0 }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 300 + delay)
    return () => clearTimeout(t)
  }, [score, delay])

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="font-mono text-xs text-slate-300">{score}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full score-bar-fill', scoreColor(score))}
          style={{ width: `${width}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  )
}

export function ScoreRing({ score, size = 72 }) {
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const [offset, setOffset] = useState(circ)

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (score / 100) * circ), 400)
    return () => clearTimeout(t)
  }, [score, circ])

  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : score >= 40 ? '#fb923c' : '#f87171'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2d45" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-base font-medium text-white leading-none">{score}</span>
        <span className="font-mono text-[9px] text-slate-500 mt-0.5">{scoreLabel(score)}</span>
      </div>
    </div>
  )
}
