import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, User, FileText } from 'lucide-react'
import { patientService } from '../../services/patientService'
import type { Patient, PatientInput } from '../../types/patient'

export default function PatientEdit() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [form, setForm] = useState<PatientInput>({
    name: '',
    age: 0,
    sex: 'Male',
    email: '',
    phone: '',
    diagnosis: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadPatient() {
      if (!id) {
        setError('Patient ID is missing.')
        setLoading(false)
        return
      }

      try {
        const record = await patientService.getById(id)

        if (!active) return

        setPatient(record)
        setForm({
          name: record.name ?? '',
          age: record.age ?? 0,
          sex: record.sex ?? 'Male',
          email: record.email ?? '',
          phone: record.phone ?? '',
          diagnosis: record.diagnosis ?? '',
          notes: record.notes ?? '',
        })
      } catch (err) {
        console.error('Patient loading failed:', err)
        if (active) setError('Patient record could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadPatient()

    return () => {
      active = false
    }
  }, [id])

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target

    setForm(previous => ({
      ...previous,
      [name]: name === 'age' ? Number(value) : value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!id || !patient) return

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please complete all required fields.')
      return
    }

    if (!Number.isInteger(form.age) || form.age < 1 || form.age > 120) {
      setError('Please enter a valid age between 1 and 120.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    try {
      setSaving(true)
      await patientService.update(id, form)
      navigate(`/patients/${id}`)
    } catch (err) {
      console.error('Patient update failed:', err)
      setError('Patient record could not be updated.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        Loading patient record...
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Patient not found
        </h2>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={() => navigate('/patients')}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Back to patients
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => navigate(`/patients/${id}`)}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back to patient details
      </button>

      <div>
        <p className="text-sm font-medium text-blue-600">Patient management</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Edit patient</h1>
        <p className="mt-2 text-sm text-slate-500">
          Update the research record for {patient.name}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <User size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Personal information</h2>
              <p className="mt-1 text-xs text-slate-500">Update patient details</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Full name *</span>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Age *</span>
              <input name="age" type="number" min="1" max="120" value={form.age || ''}
                onChange={handleChange} required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Sex *</span>
              <select name="sex" value={form.sex} onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email address *</span>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone number *</span>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Clinical information</h2>
              <p className="mt-1 text-xs text-slate-500">Diagnosis and research notes</p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Existing diagnosis</span>
            <input name="diagnosis" value={form.diagnosis} onChange={handleChange}
              placeholder="Enter existing diagnosis"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          </label>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-medium text-slate-700">Clinical notes</span>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={4}
              placeholder="Add research notes..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
          </label>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button type="button" onClick={() => navigate(`/patients/${id}`)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={17} /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
