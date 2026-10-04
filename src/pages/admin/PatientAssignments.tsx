
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Users, UserCheck, AlertCircle } from 'lucide-react'
import { API_BASE_URL, apiFetch } from '../../services/api'

interface Patient {
  id: string
  name: string
  age: number
  sex: string
  diagnosis: string
  status: string
  assigned_to_user_id: string | null
  assigned_researcher_email: string | null
}

interface Researcher {
  id: string
  email: string
  role: string
  is_active: boolean
}

export default function PatientAssignments() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [researchers, setResearchers] = useState<Researcher[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [patientResponse, userResponse] = await Promise.all([
        apiFetch(`${API_BASE_URL}/api/admin/patients`),
        apiFetch(`${API_BASE_URL}/api/admin/users`),
      ])

      if (!patientResponse.ok || !userResponse.ok) {
        throw new Error('Unable to load assignment data. Please check your Admin login.')
      }

      const patientData = await patientResponse.json()
      const userData = await userResponse.json()

      setPatients(patientData.patients || [])
      setResearchers(
        (userData.users || []).filter(
          (user: Researcher) => user.role === 'Researcher' && user.is_active,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function assignPatient(patientId: string) {
    const researcherId = selected[patientId]

    if (!researcherId) {
      setError('Please select a Researcher first.')
      return
    }

    setSaving(patientId)
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/admin/patients/${encodeURIComponent(patientId)}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ researcher_id: researcherId }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Patient assignment failed.')
      }

      setMessage(`Patient ${patientId} assigned successfully.`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed.')
    } finally {
      setSaving(null)
    }
  }

  const assignedCount = patients.filter(
    (patient) => patient.assigned_to_user_id,
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patient Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assign patients to active Researcher accounts.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Users className="mb-3 text-blue-600" size={23} />
          <p className="text-sm text-slate-500">Total Patients</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{patients.length}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <UserCheck className="mb-3 text-emerald-600" size={23} />
          <p className="text-sm text-slate-500">Assigned Patients</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{assignedCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Users className="mb-3 text-violet-600" size={23} />
          <p className="text-sm text-slate-500">Active Researchers</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{researchers.length}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">Patient Allocation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a Researcher and save the assignment for each patient.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No patients found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">Current Researcher</th>
                  <th className="px-5 py-3">Assign Researcher</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{patient.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{patient.id}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {patient.age} years · {patient.sex}
                      <p className="mt-1 text-xs text-slate-400">
                        {patient.diagnosis || patient.status || 'No diagnosis'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {patient.assigned_researcher_email ? (
                        <span className="text-emerald-700">
                          {patient.assigned_researcher_email}
                        </span>
                      ) : (
                        <span className="text-amber-600">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={
                          selected[patient.id] ??
                          patient.assigned_to_user_id ??
                          ''
                        }
                        onChange={(event) =>
                          setSelected((previous) => ({
                            ...previous,
                            [patient.id]: event.target.value,
                          }))
                        }
                        className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Select Researcher</option>
                        {researchers.map((researcher) => (
                          <option key={researcher.id} value={researcher.id}>
                            {researcher.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => void assignPatient(patient.id)}
                        disabled={
                          saving === patient.id ||
                          !selected[patient.id] ||
                          selected[patient.id] === patient.assigned_to_user_id
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving === patient.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
