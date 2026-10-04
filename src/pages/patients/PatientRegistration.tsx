import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Save, User, Mail, Phone, FileText } from 'lucide-react'
import { patientService } from '../../services/patientService'
import type { PatientInput } from '../../types/patient'

const initialForm: PatientInput = {
  name: '',
  age: 0,
  sex: 'Male',
  email: '',
  phone: '',
  diagnosis: '',
  notes: '',
}

export default function PatientRegistration() {
  const navigate = useNavigate()
  const [form, setForm] = useState<PatientInput>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

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
    if (saving) return

    setError('')
    setSuccess('')

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
      const createdPatient = await patientService.create(form)
      setSuccess(`Patient ${createdPatient.id} was registered successfully.`)
      setTimeout(() => {
        navigate('/patients')
      }, 700)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Patient registration failed. Please check the backend connection and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back to patients
      </button>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
          <UserPlus size={17} /> Patient management
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Register a patient
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the patient's basic information to create a research record.
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
              <p className="mt-1 text-xs text-slate-500">Basic patient details</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Full name *</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Age *</span>
              <input
                name="age"
                type="number"
                min="1"
                max="120"
                value={form.age || ''}
                onChange={handleChange}
                required
                placeholder="Enter age"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Sex *</span>
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail size={15} /> Email address *
              </span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="patient@example.com"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </label>

            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Phone size={15} /> Phone number *
              </span>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
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
              <p className="mt-1 text-xs text-slate-500">Optional research notes</p>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Existing diagnosis</span>
            <input
              name="diagnosis"
              value={form.diagnosis}
              onChange={handleChange}
              placeholder="Enter existing diagnosis, if known"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>

          <label className="mt-5 block space-y-2">
            <span className="text-sm font-medium text-slate-700">Clinical notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Add relevant research notes..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </section>

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </p>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/patients')}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Save size={17} /> {saving ? 'Saving patient...' : 'Save patient'}
          </button>
        </div>
      </form>
    </div>
  )
}
