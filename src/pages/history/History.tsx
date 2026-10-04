import { apiFetch } from '../../services/api'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  Search,
  FileImage,
  ArrowRight,
  Loader2,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  AlertCircle,
  Brain,
} from 'lucide-react'

interface PredictionResult {
  prediction: string
  confidence: number
  probabilities: {
    Normal: number
    Abnormal: number
  }
  model: string
  predicted_at?: string
  clinical_status?: string
}

interface Study {
  study_id: string
  patient_id: string
  filename: string
  size_bytes: number
  format: string
  status: string
  uploaded_at: string
  prediction_status?: string
  prediction_result?: PredictionResult | null
}

const API_URL = 'http://127.0.0.1:8000'

export default function HistoryPage() {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadStudies = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch(API_URL + '/api/studies')

      if (!response.ok) {
        throw new Error('Unable to retrieve study history.')
      }

      const data = await response.json()
      setStudies(data.studies || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Backend connection failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudies()
  }, [])

 const filtered = studies.filter(study => {
  const searchableText =
    study.filename + ' ' +
    study.patient_id + ' ' +
    study.study_id + ' ' +
    (study.prediction_result?.prediction || '')

  return searchableText
    .toLowerCase()
    .includes(search.toLowerCase())
})
  const completedCount = studies.filter(
    study => study.prediction_status === 'COMPLETED' &&
      study.prediction_result
  ).length

  const pendingCount = studies.length - completedCount

  const formatSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (bytes / 1024).toFixed(1) + ' KB'
}
  const formatDate = (date?: string) => {
    if (!date) return 'Not available'

    const parsed = new Date(date)

    return Number.isNaN(parsed.getTime())
      ? 'Not available'
      : parsed.toLocaleString('en-IN')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Records & Analytics
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Prediction History
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review uploaded MRI studies and their saved AI prediction results.
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <History size={26} />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Database className="text-blue-600" size={21} />

          <p className="mt-3 text-sm text-slate-500">
            Total uploaded studies
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {studies.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <CheckCircle2 className="text-emerald-600" size={21} />

          <p className="mt-3 text-sm text-slate-500">
            Predictions completed
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Clock className="text-amber-600" size={21} />

          <p className="mt-3 text-sm text-slate-500">
            Awaiting prediction
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pendingCount}
          </p>
        </div>

      </div>

      {/* STUDY HISTORY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Saved Study Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Open a study to view its details and available image preview.
            </p>
          </div>

          <button
            onClick={loadStudies}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative mt-5 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search filename, patient ID, study ID or result..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin" />
            <span className="ml-2">Loading study history...</span>
          </div>

        ) : error ? (
          <div className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>

            <button
              onClick={loadStudies}
              className="mt-2 font-semibold underline"
            >
              Retry
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileImage
              className="mx-auto text-slate-300"
              size={40}
            />

            <p className="mt-3 font-semibold text-slate-700">
              No studies found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Upload an MRI study or change your search.
            </p>
          </div>

        ) : (

          /* STUDY LIST */
          <div className="mt-5 space-y-3">

            {filtered.map(study => {
              const prediction = study.prediction_result
              const completed = Boolean(
                study.prediction_status === 'COMPLETED' && prediction
              )

              return (
                <Link
                  key={study.study_id}
                  to={'/analysis/studies/' + encodeURIComponent(study.study_id)}
                  className="block rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                >

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    {/* STUDY INFORMATION */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
                        <FileImage size={22} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {study.filename}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Patient: {study.patient_id}
                          {' · '}
                          {study.format.toUpperCase()}
                          {' · '}
                          {formatSize(study.size_bytes)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Uploaded: {formatDate(study.uploaded_at)}
                        </p>
                      </div>
                    </div>

                    {/* VALIDATION STATUS */}
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {study.status.replaceAll('_', ' ')}
                    </span>

                  </div>

                  {/* PREDICTION RESULT */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <div className="flex items-center gap-2">
                        <Brain size={18} className="text-blue-600" />

                        <span className="text-sm font-semibold text-slate-700">
                          AI Prediction
                        </span>
                      </div>

                      {completed && prediction ? (
                      <span
  className={
    'rounded-full px-3 py-1 text-xs font-bold ' +
    (prediction.prediction === 'Normal'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700')
  }
>
                          {prediction.prediction}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Not performed
                        </span>
                      )}

                    </div>

                    {completed && prediction ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">

                        <div>
                          <p className="text-xs text-slate-500">
                            Model confidence
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {prediction.confidence.toFixed(2)}%
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Normal probability
                          </p>

                          <p className="mt-1 font-semibold text-emerald-700">
                            {prediction.probabilities.Normal.toFixed(2)}%
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Abnormal probability
                          </p>

                          <p className="mt-1 font-semibold text-amber-700">
                            {prediction.probabilities.Abnormal.toFixed(2)}%
                          </p>
                        </div>

                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        Run an analysis to generate and save a prediction for this study.
                      </p>
                    )}

                    {completed && prediction && (
                      <p className="mt-3 text-xs text-slate-400">
                        Model: {prediction.model}
                        {' · '}
                        Predicted: {formatDate(prediction.predicted_at)}
                      </p>
                    )}

                  </div>

                  {/* OPEN STUDY */}
                  <div className="mt-3 flex justify-end">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                      View study
                      <ArrowRight size={16} />
                    </span>
                  </div>

                </Link>
              )
            })}

          </div>
        )}

      </div>

      <p className="text-xs leading-5 text-slate-400">
        Research prototype only. Predictions are experimental image classifications,
        not clinical diagnoses. Patient-level independence of the training dataset
        has not been established, and uploaded images are not necessarily verified
        cardiac MRI scans.
      </p>

    </div>
  )
}




