import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Database,
  Gauge,
  Info,
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'

const metrics = [
  {
    label: 'Test Accuracy',
    value: '92.90%',
    description: 'Overall correct predictions',
    icon: Gauge,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    label: 'Precision',
    value: '93.36%',
    description: 'Abnormal class precision',
    icon: Target,
    color: 'text-violet-600',
    bg: 'bg-violet-50'
  },
  {
    label: 'Recall',
    value: '96.02%',
    description: 'Abnormal class recall',
    icon: Activity,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    label: 'F1 Score',
    value: '94.67%',
    description: 'Abnormal class F1 score',
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  }
]

const classMetrics = [
  {
    name: 'Normal',
    precision: 91.95,
    recall: 86.96,
    f1: 89.39,
    support: 368
  },
  {
    name: 'Abnormal',
    precision: 93.36,
    recall: 96.02,
    f1: 94.67,
    support: 703
  }
]

const trainingHistory = [
  { epoch: 1, train: 0.654, validation: 0.565 },
  { epoch: 2, train: 0.536, validation: 0.482 },
  { epoch: 3, train: 0.467, validation: 0.424 },
  { epoch: 4, train: 0.431, validation: 0.390 },
  { epoch: 5, train: 0.397, validation: 0.358 },
  { epoch: 6, train: 0.377, validation: 0.335 },
  { epoch: 7, train: 0.360, validation: 0.319 },
  { epoch: 8, train: 0.339, validation: 0.294 },
  { epoch: 9, train: 0.329, validation: 0.287 },
  { epoch: 10, train: 0.314, validation: 0.280 }
]

function MetricCard({ item }: { item: typeof metrics[number] }) {
  const Icon = item.icon

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{item.label}</p>
        <div className={`rounded-lg p-2 ${item.bg}`}>
          <Icon size={19} className={item.color} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {item.value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
    </div>
  )
}

function ProgressMetric({
  label,
  value
}: {
  label: string
  value: number
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">
          {value.toFixed(2)}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export default function ModelPerformance() {
  return (
    <div className="space-y-7 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
            <BrainCircuit size={17} />
            MODEL EVALUATION
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Model Performance
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Experimental evaluation results of the ResNet18 classification model.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={17} />
          Evaluation completed
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(item => (
          <MetricCard key={item.label} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Confusion Matrix
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Test set: 1,071 images
            </p>
          </div>

          <div className="mx-auto max-w-md">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
              Predicted label
            </p>

            <div className="grid grid-cols-[75px_1fr_1fr] gap-2">
              <div />
              <div className="pb-1 text-center text-xs font-medium text-slate-500">
                Normal
              </div>
              <div className="pb-1 text-center text-xs font-medium text-slate-500">
                Abnormal
              </div>

              <div className="flex items-center text-xs font-medium text-slate-500">
                Actual Normal
              </div>
              <div className="flex min-h-24 flex-col items-center justify-center rounded-lg bg-emerald-100">
                <span className="text-2xl font-bold text-emerald-800">320</span>
                <span className="mt-1 text-xs text-emerald-700">Correct</span>
              </div>
              <div className="flex min-h-24 flex-col items-center justify-center rounded-lg bg-rose-50">
                <span className="text-2xl font-bold text-rose-700">48</span>
                <span className="mt-1 text-xs text-rose-600">Incorrect</span>
              </div>

              <div className="flex items-center text-xs font-medium text-slate-500">
                Actual Abnormal
              </div>
              <div className="flex min-h-24 flex-col items-center justify-center rounded-lg bg-rose-50">
                <span className="text-2xl font-bold text-rose-700">28</span>
                <span className="mt-1 text-xs text-rose-600">Incorrect</span>
              </div>
              <div className="flex min-h-24 flex-col items-center justify-center rounded-lg bg-emerald-100">
                <span className="text-2xl font-bold text-emerald-800">675</span>
                <span className="mt-1 text-xs text-emerald-700">Correct</span>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Rows represent actual classes; columns represent predicted classes.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Correct predictions</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">995</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Incorrect predictions</p>
              <p className="mt-1 text-xl font-bold text-rose-700">76</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Class-wise Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Precision, recall and F1 score by class
            </p>
          </div>

          <div className="space-y-7">
            {classMetrics.map(item => (
              <div key={item.name}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {item.support} test images
                  </span>
                </div>
                <div className="space-y-4">
                  <ProgressMetric label="Precision" value={item.precision} />
                  <ProgressMetric label="Recall" value={item.recall} />
                  <ProgressMetric label="F1 Score" value={item.f1} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Training and Validation Loss
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Loss progression over 10 training epochs
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
              Training loss
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm bg-violet-400" />
              Validation loss
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {trainingHistory.map(item => (
            <div key={item.epoch} className="grid grid-cols-[58px_1fr] items-center gap-3">
              <span className="text-xs text-slate-500">
                Epoch {item.epoch}
              </span>
              <div className="space-y-1.5">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${(item.train / 0.7) * 100}%` }}
                  />
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: `${(item.validation / 0.7) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">Final training loss</span>
          <span className="font-semibold text-slate-800">0.3140</span>
          <span className="text-slate-500">Final validation loss</span>
          <span className="font-semibold text-slate-800">0.2800</span>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Database size={19} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Model and Dataset Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Architecture', 'ResNet18'],
            ['Pretrained weights', 'ImageNet'],
            ['Input dimensions', '224 × 224 grayscale'],
            ['Compute device', 'CPU'],
            ['Training epochs', '10'],
            ['Batch size', '16'],
            ['Learning rate', '0.0001'],
            ['Total dataset images', '7,135']
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">
            Dataset split
          </h3>
          <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-blue-600" style={{ width: `${4994 / 7135 * 100}%` }} />
            <div className="bg-violet-400" style={{ width: `${1070 / 7135 * 100}%` }} />
            <div className="bg-emerald-500" style={{ width: `${1071 / 7135 * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-600">
            <span>Training: 4,994</span>
            <span>Validation: 1,070</span>
            <span>Testing: 1,071</span>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={21} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-semibold text-amber-900">
              Research limitations and interpretation
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              These metrics represent an experimental image-level evaluation.
              The dataset was split at image level, and patient-level independence
              has not been verified. Images from the same patient may therefore
              appear across different splits. The results should not be interpreted
              as clinically validated diagnostic performance.
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              This academic research prototype is not intended to replace
              professional medical assessment or clinical diagnosis.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 pb-2 text-xs leading-5 text-slate-400">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>
          Evaluation values are taken from the saved ResNet18 test evaluation.
          Percentages are rounded to two decimal places for display.
        </p>
      </div>
    </div>
  )
}
