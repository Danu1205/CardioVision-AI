import type { Patient, PatientInput } from '../types/patient'
import { API_BASE_URL, apiFetch } from './api'

interface PatientsResponse {
  total: number
  patients: PatientResponse[]
}

interface PatientResponse {
  id: string
  name: string | null
  age: number | null
  sex: 'Male' | 'Female' | 'Other' | null
  email: string | null
  phone: string | null
  diagnosis: string | null
  dateAdded: string | null
  status: Patient['status']
  notes?: string | null
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const data = await response.json()
      message = data.detail || message
    } catch {
      // Keep the fallback error message.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

function normalizePatient(data: PatientResponse): Patient {
  return {
    id: data.id,
    name: data.name ?? '',
    age: data.age ?? 0,
    sex: data.sex ?? 'Other',
    email: data.email ?? '',
    phone: data.phone ?? '',
    diagnosis: data.diagnosis ?? '',
    dateAdded: data.dateAdded ?? '',
    status: data.status ?? 'Registered',
    notes: data.notes ?? '',
  }
}

export const patientService = {
  async getAll(): Promise<Patient[]> {
    const response = await apiFetch(`${API_BASE_URL}/api/patients`)
    const data = await handleResponse<PatientsResponse>(response)

    return (data.patients ?? []).map(normalizePatient)
  },

  async getById(id: string): Promise<Patient> {
    const response = await apiFetch(
      `${API_BASE_URL}/api/patients/${encodeURIComponent(id)}`
    )

    const data = await handleResponse<PatientResponse>(response)
    return normalizePatient(data)
  },

  async create(input: PatientInput): Promise<Patient> {
    const response = await apiFetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    const data = await handleResponse<PatientResponse>(response)
    return normalizePatient(data)
  },

  async update(id: string, input: PatientInput): Promise<Patient> {
    const response = await apiFetch(
      `${API_BASE_URL}/api/patients/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      }
    )

    const data = await handleResponse<PatientResponse>(response)
    return normalizePatient(data)
  },
}
