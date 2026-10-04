import { apiFetch } from '../../services/api'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, FileImage, CalendarDays, HardDrive,
  UserRound, ScanLine, AlertCircle, Loader2
} from 'lucide-react'

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

const API_URL = 'http://127.0.0.1:8000'

export default function StudyDetails() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  const [study, setStudy] = useState<MRIStudy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadStudy() {
      setLoading(true)
      setError('')
      setStudy(null)

      try {
        const response = await apiFetch(
          `${API_URL}/api/studies/${encodeURIComponent(studyId || '')}`
        )
        if (!response.ok) throw new Error('Could not retrieve study details.')

        const data: MRIStudy = await response.json()
        if (!cancelled) setStudy(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load study.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStudy()

    return () => {
      cancelled = true
    }
  }, [studyId])

  const isImage = study && ['.jpg', '.jpeg', '.png'].includes(study.format.toLowerCase())

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    setPreviewUrl(null)
    setPreviewError('')

    async function loadPreview() {
      if (!study || !isImage) return

      try {
        const response = await apiFetch(
          `${API_URL}/api/studies/${encodeURIComponent(study.study_id)}/file`
        )

        if (!response.ok) {
          throw new Error('Could not load the protected image preview.')
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (!cancelled) {
          setPreviewUrl(objectUrl)
        } else {
          URL.revokeObjectURL(objectUrl)
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(err instanceof Error ? err.message : 'Unable to load image preview.')
        }
      }
    }

    loadPreview()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [study?.study_id, isImage])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back
      </button>

      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          MRI Study
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Study Details & Preview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Uploaded imaging study and associated metadata
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-8 text-slate-500 shadow-sm">
          <Loader2 className="animate-spin" /> Loading study...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {study && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Patient ID', value: study.patient_id, icon: UserRound },
              { label: 'File name', value: study.filename, icon: FileImage },
              { label: 'File size', value: `${(study.size_bytes / 1024).toFixed(1)} KB`, icon: HardDrive },
              { label: 'Format', value: study.format.toUpperCase().replace('.', ''), icon: ScanLine },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Icon size={17} /> {item.label}
                  </div>
                  <p className="mt-3 break-all font-semibold text-slate-900">{item.value}</p>
                </div>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="font-semibold text-slate-900">Image Preview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isImage ? 'Uploaded image file' : 'Specialized medical imaging viewer required'}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                {study.status.replaceAll('_', ' ')}
              </span>
            </div>

            <div className="flex min-h-[300px] items-center justify-center bg-slate-950 p-5">
              {isImage ? (
                previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Uploaded study preview"
                    className="max-h-[650px] max-w-full object-contain"
                  />
                ) : previewError ? (
                  <div className="text-center text-red-300">
                    <AlertCircle size={32} className="mx-auto mb-3" />
                    <p>{previewError}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Loader2 className="animate-spin" /> Loading image preview...
                  </div>
                )
              ) : (
                <div className="max-w-md text-center text-white">
                  <ScanLine size={44} className="mx-auto mb-4 text-cyan-400" />
                  <h3 className="text-lg font-semibold">Preview unavailable</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    DICOM and NIfTI files require a dedicated medical imaging viewer.
                    The uploaded file is stored, but has not been validated.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Study Information</h2>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Study ID</p>
                <p className="mt-1 break-all font-medium text-slate-800">{study.study_id}</p>
              </div>
              <div>
                <p className="text-slate-500">Upload date</p>
                <p className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                  <CalendarDays size={16} />
                  {new Date(study.uploaded_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Validation</p>
                <p className="mt-1 font-medium text-amber-700">Not yet performed</p>
              </div>
              <div>
                <p className="text-slate-500">AI classification</p>
                <p className="mt-1 font-medium text-slate-600">Model not configured</p>
              </div>
            </div>
          </div>

          <p className="text-xs leading-5 text-slate-400">
            Research prototype only. File upload and preview do not establish that an image
            is a cardiac MRI or provide a medical diagnosis.
          </p>
        </>
      )}
    </div>
  )
}
