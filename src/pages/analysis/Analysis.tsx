import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, BrainCircuit, Upload, Users,
  FileImage, ArrowRight, Server, RefreshCw
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import { checkBackendHealth } from '../../services/api'
import type { Patient } from '../../types/patient'

export default function Analysis() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsError, setPatientsError] = useState('')
  const [selectedPatient, setSelectedPatient] = useState('')
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')
  const [modelStatus, setModelStatus] = useState('CHECKING')
  const [healthMessage, setHealthMessage] = useState('Connecting to backend...')

  useEffect(() => {
    let active = true

    patientService.getAll()
      .then(data => {
        if (active) setPatients(data)
      })
      .catch(() => {
        if (active) setPatientsError('Unable to load registered patients.')
      })
      .finally(() => {
        if (active) setPatientsLoading(false)
      })

    return () => { active = false }
  }, [])

  const checkConnection = async () => {
    setBackendStatus('checking')
    try {
      const health = await checkBackendHealth()
      setBackendStatus('connected')
      setModelStatus(health.model_status)
      setHealthMessage(health.message)
    } catch {
      setBackendStatus('offline')
      setModelStatus('UNKNOWN')
      setHealthMessage('Cannot connect to FastAPI. Check that the backend server is running.')
    }
  }

  useEffect(() => {
    void checkConnection()
  }, [])

  const startUpload = () => {
    if (!selectedPatient) return
    navigate(`/analysis/upload?patientId=${encodeURIComponent(selectedPatient)}`)
  }

  const stats = [
    { label: 'Registered Patients', value: patients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'MRI Studies', value: 0, icon: FileImage, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Completed Analyses', value: 0, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      <div>
        <p className="text-xs font-semibold tracking-wider text-slate-400">CARDIOVISION AI / WORKSPACE</p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">MRI Analysis</h1>
        <p className="text-slate-500 mt-1">Manage cardiac MRI uploads and research analysis workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={22} />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BrainCircuit className="text-blue-600" size={23} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Start MRI Analysis</h2>
              <p className="text-sm text-slate-500">Select a patient before uploading a scan.</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Patient
          </label>
          <select
            value={selectedPatient}
            onChange={event => setSelectedPatient(event.target.value)}
            disabled={patientsLoading || patients.length === 0}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">
              {patientsLoading ? 'Loading patients...' : 'Choose a registered patient'}
            </option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name || 'Unnamed patient'} — {patient.id}
              </option>
            ))}
          </select>

          {patientsError && (
            <p className="text-sm text-red-600 mt-2">{patientsError}</p>
          )}
          {!patientsLoading && !patientsError && patients.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">No patients found. Register a patient first.</p>
          )}

          <button
            onClick={startUpload}
            disabled={!selectedPatient}
            className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-5 py-3 rounded-lg text-sm transition-colors"
          >
            <Upload size={17} />
            Upload MRI Scan
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="text-slate-500" size={20} />
              <h2 className="font-semibold text-slate-800">System Status</h2>
            </div>
            <button
              onClick={() => void checkConnection()}
              disabled={backendStatus === 'checking'}
              className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw size={16} className={backendStatus === 'checking' ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Backend API</p>
              <p className={`text-sm font-semibold mt-1 ${
                backendStatus === 'connected' ? 'text-green-600' :
                backendStatus === 'offline' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {backendStatus.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">AI Model</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{modelStatus}</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{healthMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
