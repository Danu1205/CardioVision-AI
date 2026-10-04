
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, ScanLine, FileText, Activity,
  ArrowUpRight, Clock, Plus,
  HeartPulse, ShieldCheck
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import { API_BASE_URL, apiFetch } from '../../services/api'
import type { Patient } from '../../types/patient'

interface Study {
  study_id: string
  patient_id?: string
  filename?: string
  uploaded_at?: string
  created_at?: string
  dateAdded?: string
  prediction_status?: string
  prediction_result?: unknown
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [studies, setStudies] = useState<Study[]>([])
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    patientService.getAll().then(setPatients).catch(error => console.error('Dashboard patient loading failed:', error))

    async function loadStudies() {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/studies`)
        if (!response.ok) throw new Error('Unable to load studies')

        const data = await response.json()
        const records = Array.isArray(data)
          ? data
          : Array.isArray(data.studies)
            ? data.studies
            : []

        setStudies(records)
        setBackendConnected(true)
      } catch (error) {
        console.error('Dashboard study loading failed:', error)
        setBackendConnected(false)
      }
    }

    loadStudies()
  }, [])

  const completedPredictions = studies.filter(study =>
    study.prediction_status === 'COMPLETED' ||
    study.prediction_result != null
  ).length

  const stats = [
    {
      label: 'Total Patients',
      value: patients.length,
      change: 'Saved research records',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'MRI Scans',
      value: studies.length,
      change: 'Uploaded studies',
      icon: ScanLine,
      color: 'cyan',
    },
    {
      label: 'Predictions Completed',
      value: completedPredictions,
      change: 'Completed model runs',
      icon: FileText,
      color: 'violet',
    },
    {
      label: 'Model Status',
      value: backendConnected ? 'Integrated' : 'Offline',
      change: 'Backend connection',
      icon: Activity,
      color: backendConnected ? 'cyan' : 'amber',
    },
  ]

  const recentPatients = [...patients]
    .sort((a, b) =>
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    )
    .slice(0, 5)

  const recentStudies = studies.length

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <p className="text-sm font-medium text-blue-600">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Welcome back. Here's your cardiac imaging research workspace.
          </p>
        </div>

        <button
          onClick={() => navigate('/patients/register')}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Register patient
        </button>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  {stat.label}
                </span>
                <div className={`rounded-xl p-2.5 ${colorClasses[stat.color]}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-slate-400">{stat.change}</p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">MRI Analysis Overview</h2>
              <p className="mt-1 text-xs text-slate-500">
                Current research workflow
              </p>
            </div>
            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
              Live records
            </span>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Uploaded MRI studies</span>
                <span className="font-semibold text-slate-900">{recentStudies}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                  style={{ width: recentStudies ? '100%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Predictions completed</span>
                <span className="font-semibold text-slate-900">
                  {completedPredictions}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{
                    width: recentStudies
                      ? `${Math.min((completedPredictions / recentStudies) * 100, 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </div>
          </div>

          <p className="mt-8 text-[11px] text-slate-400">
            Counts are calculated from the currently saved backend records.
          </p>
        </section>

        <section className="rounded-2xl bg-[#101b33] p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-cyan-300">
              <HeartPulse size={23} />
            </div>
            <div>
              <h2 className="font-bold">CardioVision AI</h2>
              <p className="text-xs text-slate-400">
                Research model information
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Backend connection</span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                backendConnected
                  ? 'bg-emerald-400/10 text-emerald-300'
                  : 'bg-amber-400/10 text-amber-300'
              }`}>
                {backendConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <p className="mt-3 text-lg font-semibold">
              ResNet18 research model
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Model predictions are available through the integrated backend.
              Results are experimental and require further validation.
            </p>
          </div>

          <div className="mt-5 flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-slate-400">
              Research prototype. AI output is not intended for clinical diagnosis.
            </p>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Recent patient records</h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest registered research patients
            </p>
          </div>
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View all <ArrowUpRight size={14} />
          </button>
        </div>

        {recentPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient ID</th>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Date added</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPatients.map(patient => (
                  <tr key={patient.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4 font-medium text-blue-600">
                      {patient.id}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {patient.name}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(patient.dateAdded).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No patient records yet. Register a patient to see records here.
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={14} />
        CardioVision AI · Deep Learning-Based Myocarditis Research Platform
        <span className="ml-auto">
          {backendConnected ? 'Backend connected' : 'Backend unavailable'}
        </span>
      </div>
    </div>
  )
}





