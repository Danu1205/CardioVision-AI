
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw,
  FileImage, AlertTriangle, ScanLine, ArrowRight
} from 'lucide-react'

interface PreviewState {
  patientId: string
  file: File
  studyId: string
  uploadResult?: {
    study_id?: string
    status?: string
  }
}

export default function MRIPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as PreviewState | null

  const [imageUrl, setImageUrl] = useState('')
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  const file = state?.file
  const patientId = state?.patientId
  const studyId = state?.studyId || state?.uploadResult?.study_id
  const isImage = !!file && /\.(jpg|jpeg|png)$/i.test(file.name)

  useEffect(() => {
    if (!file || !isImage) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  if (!file || !patientId || !studyId) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-white rounded-2xl p-8 text-center card-shadow">
        <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Preview unavailable</h2>
        <p className="text-slate-500 mt-2">
          Required upload information is missing. Please upload the file again.
        </p>
        <button
          onClick={() => navigate('/analysis/upload')}
          className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Return to upload
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={18} /> Back to upload
      </button>

      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>WORKSPACE</span><span>/</span><span>MRI ANALYSIS</span><span>/</span>
          <span className="text-blue-600">PREVIEW</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">MRI Image Preview</h1>
        <p className="text-slate-500 mt-1">
          Review the selected file before further processing.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden card-shadow">
          <div className="flex flex-wrap justify-between items-center gap-3 p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                <ScanLine size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Image Viewer</p>
                <p className="text-xs text-slate-400">{file.name}</p>
              </div>
            </div>

            {isImage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-2 border rounded-lg hover:bg-slate-50"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm text-slate-500 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 border rounded-lg hover:bg-slate-50"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => {
                    setZoom(1)
                    setBrightness(100)
                    setContrast(100)
                  }}
                  className="p-2 border rounded-lg hover:bg-slate-50"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#101827] min-h-[420px] flex items-center justify-center overflow-auto p-6">
            {isImage && imageUrl ? (
              <img
                src={imageUrl}
                alt="Selected image file preview"
                className="max-w-full max-h-[650px] object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%)`
                }}
              />
            ) : (
              <div className="text-center text-slate-300 max-w-md">
                <FileImage size={52} className="mx-auto mb-4 text-cyan-400" />
                <h3 className="font-semibold text-lg">
                  Preview requires a medical image parser
                </h3>
                <p className="text-sm text-slate-400 mt-2">
                  DICOM/NIfTI decoding has not yet been integrated.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Image display only. No cardiac anatomy verification or clinical diagnosis has been performed.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 card-shadow">
            <h3 className="font-bold text-slate-800 mb-4">File information</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400">Patient ID</p>
                <p className="font-semibold text-slate-700 mt-1">{patientId}</p>
              </div>
              <div>
                <p className="text-slate-400">Study ID</p>
                <p className="font-semibold text-slate-700 mt-1 break-all">{studyId}</p>
              </div>
              <div>
                <p className="text-slate-400">File name</p>
                <p className="font-semibold text-slate-700 mt-1 break-all">{file.name}</p>
              </div>
              <div>
                <p className="text-slate-400">File size</p>
                <p className="font-semibold text-slate-700 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-slate-400">Format</p>
                <p className="font-semibold text-slate-700 mt-1">
                  {file.name.split('.').pop()?.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Processing status</p>
                <span className="inline-block mt-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  File uploaded
                </span>
              </div>
            </div>
          </div>

          {isImage && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 card-shadow space-y-5">
              <h3 className="font-bold text-slate-800">Display adjustments</h3>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-slate-500">Brightness</label>
                  <span className="font-medium text-slate-700">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="text-slate-500">Contrast</label>
                  <span className="font-medium text-slate-700">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={e => setContrast(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <div className="flex gap-2 items-start">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p>
                Research prototype only. This preview does not establish that the selected image is a cardiac MRI scan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => navigate('/analysis/results', {
            state: {
              patientId,
              file,
              fileName: file.name,
              studyId,
              uploadResult: state.uploadResult
            }
          })}
          className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 transition"
        >
          Proceed to Analysis Workspace <ArrowRight size={19} />
        </button>
      </div>
    </div>
  )
}