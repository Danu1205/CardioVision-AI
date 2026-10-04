import { apiFetch } from '../../services/api'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import {
  ArrowLeft, Upload, FileImage, X,
  AlertCircle, ScanLine, ShieldCheck, Loader2
} from 'lucide-react'
import { patientService } from '../../services/patientService'
import type { Patient } from '../../types/patient'

const API_URL = 'http://127.0.0.1:8000'

export default function MRIUpload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])

  const [patientId, setPatientId] = useState(
    searchParams.get('patientId') || ''
  )
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let active = true
    patientService.getAll()
      .then(data => {
        if (active) setPatients(data)
      })
      .catch(() => {
        if (active) setError('Unable to load registered patients.')
      })
    return () => { active = false }
  }, [])

  const onDrop = useCallback((files: File[]) => {
    setError('')
    const selected = files[0]
    if (!selected) return

    const allowed = ['.dcm', '.nii', '.gz', '.jpg', '.jpeg', '.png']
    const extension = selected.name.substring(
      selected.name.lastIndexOf('.')
    ).toLowerCase()

    if (!allowed.includes(extension)) {
      setError('Unsupported file format.')
      return
    }

    if (selected.size === 0 || selected.size > 100 * 1024 * 1024) {
      setError('File must be greater than 0 bytes and no larger than 100 MB.')
      return
    }

    setFile(selected)
  }, [])

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const handleUpload = async () => {
    if (!patientId || !file) {
      setError('Select a patient and an MRI file.')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('patient_id', patientId)
      formData.append('file', file)

      const response = await apiFetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.detail || 'Upload failed.')
      }

      navigate('/analysis/preview', {
        state: {
          patientId,
          file,
          studyId: result.study_id,
          uploadResult: result,
        },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the backend.'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/analysis')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={17} /> Back to MRI Analysis
      </button>

      <div>
        <p className="text-xs font-semibold tracking-wider text-slate-400">
          CARDIOVISION AI / MRI WORKFLOW
        </p>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">
          Upload MRI Study
        </h1>
        <p className="text-slate-500 mt-1">
          Select a patient and upload an imaging file.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select patient
          </label>
          <select
            value={patientId}
            onChange={event => setPatientId(event.target.value)}
            disabled={uploading}
            className="w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-700"
          >
            <option value="">Choose a registered patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name} — {patient.id}
              </option>
            ))}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Upload size={28} />
          </div>

          <h3 className="text-lg font-semibold text-slate-800 mt-5">
            {isDragActive ? 'Drop your file here' : 'Upload cardiac imaging file'}
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Drag and drop your file or browse your computer.
          </p>

          <button
            type="button"
            onClick={open}
            disabled={uploading}
            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Browse files
          </button>

          <p className="text-xs text-slate-400 mt-5">
            DICOM, NIfTI, JPG and PNG · Maximum 100 MB
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-4 border border-slate-200 rounded-xl p-4">
            <FileImage size={24} className="text-cyan-600" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-sm text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={uploading}
              title="Remove file"
              className="text-slate-400 hover:text-red-500"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || !patientId || uploading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold p-4"
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ScanLine size={20} />
              Upload and continue to MRI preview
            </>
          )}
        </button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
        <ShieldCheck size={21} className="shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">Research prototype only</p>
          <p className="mt-1">
            The backend currently checks file extension and size only.
            It does not validate cardiac anatomy or run an AI model.
            Use fictional or de-identified test files only.
          </p>
        </div>
      </div>
    </div>
  )
}



