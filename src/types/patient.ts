export interface Patient {
  id: string
  name: string
  age: number
  sex: 'Male' | 'Female' | 'Other'
  email: string
  phone: string
  diagnosis: string
  dateAdded: string
  status: 'Registered' | 'MRI Uploaded' | 'Analysis Pending' | 'Completed'
  notes?: string
}

export type PatientInput = Omit<Patient, 'id' | 'dateAdded' | 'status'>
