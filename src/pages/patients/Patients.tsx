import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Users, Eye, UserRound, Filter, RefreshCw
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import type { Patient } from '../../types/patient'

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPatients = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await patientService.getAll()
      setPatients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load patients.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch =
        patient.name.toLowerCase().includes(search.toLowerCase()) ||
        patient.id.toLowerCase().includes(search.toLowerCase()) ||
        patient.email.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'All' || patient.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [patients, search, statusFilter])

  const statusStyles: Record<string, string> = {
    Registered: 'bg-blue-50 text-blue-700',
    'MRI Uploaded': 'bg-cyan-50 text-cyan-700',
    'Analysis Pending': 'bg-amber-50 text-amber-700',
    Completed: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Patient management</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Patients
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage patient research records and cardiac MRI studies.
          </p>
        </div>

        <button
          onClick={() => navigate('/patients/register')}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Plus size={18} /> Register patient
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total patients</p>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Users size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{patients.length}</p>
          <p className="mt-1 text-xs text-slate-400">Saved research records</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Registered</p>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <UserRound size={20} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {patients.filter(patient => patient.status === 'Registered').length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Awaiting further workflow steps</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Patient records</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredPatients.length} record(s) displayed
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search name, ID or email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 sm:w-64"
              />
            </div>

            <div className="relative">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-blue-500"
              >
                <option value="All">All statuses</option>
                <option value="Registered">Registered</option>
                <option value="MRI Uploaded">MRI Uploaded</option>
                <option value="Analysis Pending">Analysis Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              onClick={() => void loadPatients()}
              disabled={loading}
              title="Refresh records"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button onClick={() => void loadPatients()} className="ml-2 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="px-5 py-16 text-center text-sm text-slate-500">
            Loading patient records...
          </div>
        ) : filteredPatients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Patient</th>
                  <th className="px-5 py-4 font-semibold">Patient ID</th>
                  <th className="px-5 py-4 font-semibold">Age / Sex</th>
                  <th className="px-5 py-4 font-semibold">Date added</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{patient.name || 'Details unavailable'}</p>
                      <p className="mt-1 text-xs text-slate-400">{patient.email}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-blue-600">{patient.id}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {patient.age || '—'} / {patient.sex || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {patient.dateAdded ? new Date(patient.dateAdded).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[patient.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          title="View patient"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Users size={28} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              {search || statusFilter !== 'All' ? 'No matching patients' : 'No patient records yet'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {search || statusFilter !== 'All'
                ? 'Try changing your search or status filter.'
                : 'Register your first research patient to get started.'}
            </p>
            {!search && statusFilter === 'All' && (
              <button
                onClick={() => navigate('/patients/register')}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={16} /> Register patient
              </button>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Patient records are managed by the CardioVision AI research database. Use anonymized data for this prototype.
      </p>
    </div>
  )
}
