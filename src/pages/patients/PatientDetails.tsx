import { apiFetch } from '../../services/api'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Phone, CalendarDays,
  FileText, Pencil, ScanLine, ShieldCheck,
  Upload, RefreshCw, AlertCircle, FileImage
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import type { Patient } from '../../types/patient'

const API_URL = 'http://127.0.0.1:8000'

interface MRIStudy {
  study_id: string
  patient_id: string
  filename: string
  stored_filename: string
  size_bytes: number
  format: string
  status: string
  uploaded_at: string
}

interface StudiesResponse {
  patient_id: string
  total_studies: number
  studies: MRIStudy[]
}

export default function PatientDetails() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [loadingPatient, setLoadingPatient] = useState(true)
  const [patientError, setPatientError] = useState('')

  const [studies, setStudies] = useState<MRIStudy[]>([])
  const [loadingStudies, setLoadingStudies] = useState(false)
  const [studyError, setStudyError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchPatient() {
      if (!id) {
        setPatientError('Patient ID is missing.')
        setLoadingPatient(false)
        return
      }

      setLoadingPatient(true)
      setPatientError('')

      try {
        const data = await patientService.getById(id)
        if (!cancelled) setPatient(data)
      } catch (error) {
        if (!cancelled) {
          setPatient(null)
          setPatientError(
            error instanceof Error ? error.message : 'Unable to retrieve patient.'
          )
        }
      } finally {
        if (!cancelled) setLoadingPatient(false)
      }
    }

    void fetchPatient()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!patient?.id) return

    let cancelled = false

    async function fetchStudies() {
      setLoadingStudies(true)
      setStudyError('')

      try {
        const response = await apiFetch(
          `${API_URL}/api/patients/${encodeURIComponent(patient!.id)}/studies`
        )

        if (!response.ok) {
          throw new Error('Unable to retrieve MRI studies.')
        }

        const data: StudiesResponse = await response.json()

        if (!cancelled) setStudies(data.studies || [])
      } catch {
        if (!cancelled) {
          setStudyError(
            'Could not retrieve MRI studies. Check the backend connection and try again.'
          )
        }
      } finally {
        if (!cancelled) setLoadingStudies(false)
      }
    }

    void fetchStudies()

    return () => {
      cancelled = true
    }
  }, [patient?.id])

  if (loadingPatient) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <RefreshCw size={25} className="mx-auto animate-spin text-blue-600" />
        <p className="mt-4 text-sm text-slate-500">Loading patient details...</p>
      </div>
    )
  }

  if (patientError || !patient) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <User size={32} className="mx-auto text-slate-400" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">
          Patient unavailable
        </h2>
        <p className="mt-2 text-sm text-red-600">
          {patientError || 'This patient record could not be found.'}
        </p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Back to patients
        </button>
      </div>
    )
  }

  const details = [
    { label: 'Full name', value: patient.name || 'Not provided', icon: User },
    { label: 'Age', value: patient.age ? `${patient.age} years` : 'Not provided', icon: CalendarDays },
    { label: 'Sex', value: patient.sex || 'Not provided', icon: User },
    { label: 'Email address', value: patient.email || 'Not provided', icon: Mail },
    { label: 'Phone number', value: patient.phone || 'Not provided', icon: Phone },
    {
      label: 'Date registered',
      value: patient.dateAdded
        ? new Date(patient.dateAdded).toLocaleDateString('en-IN')
        : 'Not available',
      icon: CalendarDays
    },
  ]

  const formatSize = (bytes: number) => {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back to patients
      </button>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Patient management / Profile</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Patient details
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Research record information and study overview.
          </p>
        </div>

        <button
          onClick={() => navigate(`/patients/${patient.id}/edit`)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Pencil size={16} /> Edit
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
            {(patient.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {patient.name || 'Unspecified patient'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{patient.id}</p>
            <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {patient.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <ShieldCheck size={17} />
            Research record
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Personal information</h2>
            <p className="mt-1 text-xs text-slate-500">Patient profile details</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(item => {
            const Icon = item.icon
            return (
              <div key={item.label}>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Icon size={15} /> {item.label}
                </div>
                <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                  {item.value}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Clinical information</h2>
            <p className="mt-1 text-xs text-slate-500">Research notes and diagnosis</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs text-slate-400">Existing diagnosis</p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {patient.diagnosis || 'Not provided'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Clinical notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {patient.notes || 'No notes have been added.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
              <ScanLine size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Cardiac MRI studies</h2>
              <p className="mt-1 text-xs text-slate-500">
                Studies uploaded for this patient
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              {studies.length} {studies.length === 1 ? 'Study' : 'Studies'}
            </span>
            <button
              onClick={() => navigate(`/analysis/upload?patientId=${encodeURIComponent(patient.id)}`)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Upload size={16} /> Upload MRI
            </button>
          </div>
        </div>

        {loadingStudies && (
          <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
            <RefreshCw size={17} className="animate-spin" />
            Loading MRI studies...
          </div>
        )}

        {studyError && (
          <div className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="shrink-0" />
            {studyError}
            <button
              onClick={() => navigate(0)}
              className="ml-auto shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loadingStudies && !studyError && studies.length === 0 && (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <ScanLine size={28} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No MRI studies linked
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Upload an imaging file to associate it with this patient.
            </p>
          </div>
        )}

        {!loadingStudies && !studyError && studies.length > 0 && (
          <div className="mt-5 space-y-3">
            {studies.map(study => (
              <div
                key={study.study_id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/analysis/studies/${encodeURIComponent(study.study_id)}`)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/analysis/studies/${encodeURIComponent(study.study_id)}`)
                  }
                }}
                className="flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <FileImage size={23} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {study.filename}
                  </p>
                  <p className="mt-1 break-all text-xs text-slate-400">
                    Study ID: {study.study_id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatSize(study.size_bytes)} · {study.format.toUpperCase()} ·{' '}
                    {study.uploaded_at
                      ? new Date(study.uploaded_at).toLocaleString('en-IN')
                      : 'Date unavailable'}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  {study.status.replaceAll('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Research prototype only. Use anonymized data; this application is not a clinical record system.
      </p>
    </div>
  )
}
