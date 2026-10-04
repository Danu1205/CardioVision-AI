import { useEffect, useState } from 'react'
import {
  Settings, Monitor, Database, Server, BrainCircuit,
  RefreshCw, Trash2, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react'
import { API_BASE_URL } from '../../services/api'

const PATIENTS_KEY = 'cardiovision_patients'
const LANDING_KEY = 'cardiovision_default_landing'
const CONFIRM_KEY = 'cardiovision_confirm_delete'

interface HealthStatus {
  status?: string
  model_status?: string
  message?: string
}

export default function SettingsPage() {
  const [defaultPage, setDefaultPage] = useState(
    localStorage.getItem(LANDING_KEY) || '/dashboard'
  )
  const [confirmDelete, setConfirmDelete] = useState(
    localStorage.getItem(CONFIRM_KEY) !== 'false'
  )
  const [patientCount, setPatientCount] = useState(0)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastChecked, setLastChecked] = useState('')

  const updatePatientCount = () => {
    try {
      const patients = JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]')
      setPatientCount(Array.isArray(patients) ? patients.length : 0)
    } catch {
      setPatientCount(0)
    }
  }

  const checkBackend = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`)
      if (!response.ok) throw new Error('Backend unavailable')
      const data = await response.json()
      setHealth(data)
      setLastChecked(new Date().toLocaleTimeString())
    } catch {
      setHealth(null)
      setLastChecked(new Date().toLocaleTimeString())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    updatePatientCount()
    checkBackend()
  }, [])

  const handleDefaultPage = (value: string) => {
    setDefaultPage(value)
    localStorage.setItem(LANDING_KEY, value)
  }

  const handleConfirmDelete = (checked: boolean) => {
    setConfirmDelete(checked)
    localStorage.setItem(CONFIRM_KEY, String(checked))
  }

  const clearPatientRecords = () => {
    if (confirmDelete && !window.confirm(
      'Delete all locally stored patient profiles? This cannot be undone. Backend MRI studies and prediction records will not be deleted.'
    )) return

    localStorage.removeItem(PATIENTS_KEY)
    updatePatientCount()
    window.alert('Local patient profiles have been cleared.')
  }

  const resetPreferences = () => {
    localStorage.removeItem(LANDING_KEY)
    localStorage.removeItem(CONFIRM_KEY)
    setDefaultPage('/dashboard')
    setConfirmDelete(true)
  }

  const backendOnline = Boolean(health)
  const modelReady = health?.model_status?.toLowerCase().includes('loaded') ||
    health?.model_status?.toLowerCase().includes('ready')

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Settings size={23} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500">
              Manage application preferences, system status and local data.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <Monitor className="text-blue-600" size={21} />
          <div>
            <h2 className="font-semibold text-slate-800">Application preferences</h2>
            <p className="text-xs text-slate-500">Customize how CardioVision AI opens.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Default landing page</p>
            <p className="text-xs text-slate-500">Choose the page opened when visiting the application root.</p>
          </div>
          <select
            value={defaultPage}
            onChange={(e) => handleDefaultPage(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="/dashboard">Dashboard</option>
            <option value="/patients">Patients</option>
            <option value="/analysis">MRI Analysis</option>
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-sm font-medium text-slate-700">Confirm before deleting patient profiles</p>
            <p className="text-xs text-slate-500">Require confirmation before clearing locally stored patient profiles.</p>
          </div>
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => handleConfirmDelete(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
        </div>

        <p className="mt-4 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mr-1 inline" />
          Preferences are saved automatically in this browser.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Server className="text-blue-600" size={21} />
            <div>
              <h2 className="font-semibold text-slate-800">System status</h2>
              <p className="text-xs text-slate-500">Live connection information.</p>
            </div>
          </div>
          <button
            onClick={checkBackend}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <Server size={17} />
              <span className="text-xs font-medium">Backend API</span>
            </div>
            <div className="flex items-center gap-2">
              {backendOnline
                ? <CheckCircle2 size={17} className="text-emerald-600" />
                : <AlertCircle size={17} className="text-red-500" />}
              <span className={`text-sm font-semibold ${backendOnline ? 'text-emerald-700' : 'text-red-600'}`}>
                {loading ? 'Checking...' : backendOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              <BrainCircuit size={17} />
              <span className="text-xs font-medium">AI Model</span>
            </div>
            <div className="flex items-center gap-2">
              {modelReady
                ? <CheckCircle2 size={17} className="text-emerald-600" />
                : <AlertCircle size={17} className="text-amber-500" />}
              <span className="text-sm font-semibold text-slate-700">
                {health?.model_status || (loading ? 'Checking...' : 'Status unavailable')}
              </span>
            </div>
          </div>
        </div>
        {health?.message && (
          <p className="mt-3 text-xs text-slate-500">{health.message}</p>
        )}
        {lastChecked && (
          <p className="mt-3 text-right text-[11px] text-slate-400">Last checked: {lastChecked}</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <Database className="text-blue-600" size={21} />
          <div>
            <h2 className="font-semibold text-slate-800">Local data management</h2>
            <p className="text-xs text-slate-500">Review data stored in this browser.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Patient profiles</p>
            <p className="text-xs text-slate-500">Stored in this browser's local storage.</p>
          </div>
          <span className="text-2xl font-bold text-slate-800">{patientCount}</span>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={19} className="mt-0.5 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Data deletion</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                This action clears patient profiles stored in this browser only. It does not delete backend MRI studies or prediction records.
              </p>
            </div>
          </div>
          <button
            onClick={clearPatientRecords}
            disabled={patientCount === 0}
            className="mt-4 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={14} />
            Clear local patient profiles
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Reset application preferences</p>
          <p className="text-xs text-slate-500">Restore the default landing page and confirmation preference.</p>
        </div>
        <button
          onClick={resetPreferences}
          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Reset preferences
        </button>
      </section>

      <p className="text-center text-xs text-slate-400">
        CardioVision AI · Research Prototype · Settings are stored locally in this browser.
      </p>
    </div>
  )
}
