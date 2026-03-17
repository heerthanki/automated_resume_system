import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Users, GitBranch,
  Cpu, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',      icon: Briefcase,       label: 'Job Boards' },
  { to: '/pipeline',  icon: GitBranch,       label: 'Run Pipeline' },
  { to: '/candidates',icon: Users,           label: 'Candidates' },
]

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-56 h-screen flex flex-col bg-[#0d1424] border-r border-slate-800/60 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Cpu size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="font-display text-white text-sm leading-tight">Automated Resume screening</p>
            <p className="font-mono text-[10px] text-slate-500 leading-tight">AI Recruitment</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 py-2 font-mono text-[10px] text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {nav.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
              )}
              <Icon size={15} className={active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-medium">{label}</span>
              {active && <ChevronRight size={12} className="ml-auto text-amber-500/60" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 agent-pulse" />
          <span className="font-mono text-[10px] text-slate-500">Agents online</span>
        </div>
      </div>
    </aside>
  )
}
