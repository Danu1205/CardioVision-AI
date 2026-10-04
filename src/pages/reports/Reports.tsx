import { apiFetch } from '../../services/api'
import { patientService } from '../../services/patientService'
import type { Patient } from '../../types/patient'
import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Printer
} from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000'

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

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return entities[character]
  })
}

function formatDate(value?: string): string {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString()
}

function createReport(study: Study, patient?: Patient) {
  const result = study.prediction_result
  if (!result) return

  const reportWindow = window.open('', '_blank')
  if (!reportWindow) {
    alert('Please allow pop-ups for this website to generate the report.')
    return
  }

  const patientName = patient?.name || 'Not available'
  const patientAge = patient?.age ?? 'Not available'
  const patientSex = patient?.sex || 'Not available'

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CardioVision AI - Research Report</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #172033;
    margin: 0;
    padding: 36px;
    background: #fff;
    line-height: 1.5;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  h1 { margin: 0; color: #173b72; font-size: 25px; }
  .subtitle { color: #64748b; font-size: 12px; margin-top: 5px; }
  .tag {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 7px 11px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: bold;
  }
  h2 {
    font-size: 15px;
    color: #173b72;
    border-bottom: 1px solid #dbe3ef;
    padding-bottom: 8px;
    margin-top: 26px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .field {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 12px;
    border-radius: 6px;
    overflow-wrap: anywhere;
  }
  .label {
    color: #64748b;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .value { font-size: 13px; font-weight: bold; margin-top: 4px; }
  .prediction {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    padding: 18px;
  }
  .prediction strong { font-size: 22px; color: #1d4ed8; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td {
    border: 1px solid #e2e8f0;
    padding: 10px;
    text-align: left;
    font-size: 12px;
  }
  th { background: #f1f5f9; }
  .notice {
    margin-top: 28px;
    padding: 15px;
    border: 1px solid #fcd34d;
    background: #fffbeb;
    border-radius: 7px;
    color: #92400e;
    font-size: 11px;
  }
  .footer {
    margin-top: 30px;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    color: #94a3b8;
    font-size: 10px;
  }
  .print-button {
    background: #2563eb;
    color: white;
    border: 0;
    padding: 11px 18px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }
  @media print {
    body { padding: 0; }
    .print-button { display: none; }
    @page { size: A4; margin: 16mm; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>CardioVision AI</h1>
      <div class="subtitle">Deep Learning-Based Detection and Classification of Myocarditis Using Cardiac MRI</div>
      <div class="subtitle">Experimental Research Study Report</div>
    </div>
    <span class="tag">RESEARCH PROTOTYPE</span>
  </div>

  <button class="print-button" onclick="window.print()">Print / Save as PDF</button>

  <h2>Patient Information</h2>
  <div class="grid">
    <div class="field"><div class="label">Patient ID</div><div class="value">${escapeHtml(study.patient_id)}</div></div>
    <div class="field"><div class="label">Patient Name</div><div class="value">${escapeHtml(patientName)}</div></div>
    <div class="field"><div class="label">Age</div><div class="value">${escapeHtml(patientAge)}</div></div>
    <div class="field"><div class="label">Sex</div><div class="value">${escapeHtml(patientSex)}</div></div>
  </div>

  <h2>MRI Study Information</h2>
  <div class="grid">
    <div class="field"><div class="label">Study ID</div><div class="value">${escapeHtml(study.study_id)}</div></div>
    <div class="field"><div class="label">Uploaded File</div><div class="value">${escapeHtml(study.filename)}</div></div>
    <div class="field"><div class="label">File Format</div><div class="value">${escapeHtml(study.format)}</div></div>
    <div class="field"><div class="label">Upload Date</div><div class="value">${escapeHtml(formatDate(study.uploaded_at))}</div></div>
  </div>

  <h2>Experimental Model Output</h2>
  <div class="prediction">
    <div class="label">Predicted Class</div>
    <strong>${escapeHtml(result.prediction)}</strong>
    <p>Model confidence: <b>${escapeHtml(result.confidence.toFixed(2))}%</b></p>
  </div>

  <table>
    <thead>
      <tr><th>Class</th><th>Predicted Probability</th></tr>
    </thead>
    <tbody>
      <tr><td>Normal</td><td>${escapeHtml(result.probabilities.Normal.toFixed(2))}%</td></tr>
      <tr><td>Abnormal</td><td>${escapeHtml(result.probabilities.Abnormal.toFixed(2))}%</td></tr>
    </tbody>
  </table>

  <h2>Model Information</h2>
  <div class="grid">
    <div class="field"><div class="label">Model Architecture</div><div class="value">${escapeHtml(result.model)}</div></div>
    <div class="field"><div class="label">Prediction Date</div><div class="value">${escapeHtml(formatDate(result.predicted_at))}</div></div>
  </div>

  <div class="notice">
    <b>Important Research Disclaimer</b><br><br>
    This report contains experimental output generated by an academic deep learning research prototype.
    The predicted class and probabilities are model outputs, not a medical diagnosis.
    This system has not been established as a clinically validated diagnostic tool.
    The results must not be used independently for patient management or treatment decisions.
    Interpretation requires qualified medical professionals and further independent clinical validation.
  </div>

  <div class="footer">
    Generated by CardioVision AI | ${escapeHtml(new Date().toLocaleString())}<br>
    Experimental academic research documentation
  </div>
</body>
</html>`

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
  reportWindow.focus()
}

export default function Reports() {
  const [studies, setStudies] = useState<Study[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [response, patientRecords] = await Promise.all([
        apiFetch(`${API_URL}/api/studies`),
        patientService.getAll()
      ])

      if (!response.ok) throw new Error('Could not load study records.')

      const data = await response.json()
      setStudies(Array.isArray(data) ? data : data.studies || [])
      setPatients(patientRecords)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const completedStudies = useMemo(
    () => studies.filter(
      study =>
        study.prediction_status === 'COMPLETED' &&
        study.prediction_result
    ),
    [studies]
  )

  const filteredStudies = completedStudies.filter(study => {
    const patient = patients.find(item => item.id === study.patient_id)
    const query = search.toLowerCase()

    return (
      study.filename.toLowerCase().includes(query) ||
      study.patient_id.toLowerCase().includes(query) ||
      study.study_id.toLowerCase().includes(query) ||
      (patient?.name || '').toLowerCase().includes(query) ||
      (study.prediction_result?.prediction || '').toLowerCase().includes(query)
    )
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Documentation
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Research Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate printable experimental reports from completed MRI studies.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total studies</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{studies.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Completed predictions</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{completedStudies.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Reports available</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{completedStudies.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Available reports</h2>
            <p className="mt-1 text-xs text-slate-500">
              Only studies with completed model predictions are listed.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search patient, filename or ID..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            Loading study records...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-8 text-sm text-rose-600">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={38} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">
              {completedStudies.length === 0
                ? 'No completed reports yet'
                : 'No matching reports'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {completedStudies.length === 0
                ? 'Complete an MRI prediction to make a report available.'
                : 'Try another search term.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudies.map(study => {
              const patient = patients.find(item => item.id === study.patient_id)
              const result = study.prediction_result!

              return (
                <div
                  key={study.study_id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-3">
                      <FileText size={21} className="text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-800">
                        {study.filename}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {patient?.name || study.patient_id} · {study.patient_id}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Study ID: {study.study_id}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                          <CheckCircle2 size={12} />
                          Prediction completed
                        </span>
                        <span className="text-slate-500">
                          Output: {result.prediction}
                        </span>
                        <span className="text-slate-500">
                          Confidence: {result.confidence.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => createReport(study, patient)}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Printer size={16} />
                    Generate PDF
                    <Download size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <p className="text-xs leading-5 text-amber-900">
          Reports contain experimental model outputs and are intended for academic
          research documentation only. They are not medical diagnoses or
          clinically validated reports. Patient information is retrieved from
          the application database.
        </p>
      </div>
    </div>
  )
}
