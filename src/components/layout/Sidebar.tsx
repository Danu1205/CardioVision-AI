import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ScanLine, History, FileText,
  ChartNoAxesCombined, Settings, HeartPulse, Activity,
  UserCog, ClipboardList, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'MRI Analysis', path: '/analysis', icon: ScanLine },
  { label: 'Prediction History', path: '/history', icon: History },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Model Performance', path: '/performance', icon: ChartNoAxesCombined },
]

const adminNavigation = [
  { label: 'User Management', path: '/admin/users', icon: UserCog },
  { label: 'Patient Assignments', path: '/admin/assignments', icon: ClipboardList },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
]

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-all ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`

export default function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col bg-[#101b33] text-white lg:flex">
      <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <HeartPulse size={23} />
        </div>
        <div>
          <h1 className="text-lg font-bold">
            CardioVision<span className="text-cyan-400"> AI</span>
          </h1>
          <p className="text-[10px] tracking-[2px] text-slate-400">
            CARDIAC INTELLIGENCE
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-7">
        <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {isAdmin && (
          <>
            <p className="mb-4 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
              Administration
            </p>
            <nav className="space-y-1">
              {adminNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </>
        )}

        <p className="mb-4 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
          Preferences
        </p>
        <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
          <Settings size={18} />
          Settings
        </NavLink>
      </div>

      <div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-2 text-xs font-semibold">Need assistance?</p>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Explore the platform guide and learn about MRI analysis.
        </p>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 px-6 py-4">
        <Activity size={15} className="text-emerald-400" />
        <span className="text-[10px] text-slate-400">Research prototype</span>
      </div>
    </aside>
  )
}
