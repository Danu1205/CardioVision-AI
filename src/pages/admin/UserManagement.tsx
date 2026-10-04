
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { API_BASE_URL, apiFetch } from '../../services/api'

interface AdminUser {
  id: string
  email: string
  role: 'Admin' | 'Researcher'
  is_active: boolean
  created_at: string | null
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not load users')
      setUsers(data.users)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function createResearcher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Creation failed')

      setMessage('Researcher account created successfully.')
      setEmail('')
      setPassword('')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed')
    }
  }

  async function changeStatus(user: AdminUser) {
    setError('')
    setMessage('')

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/admin/users/${user.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !user.is_active }),
        },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Update failed')

      setMessage('Researcher account updated.')
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-blue-600">Administration</p>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500">
          Create and manage Researcher accounts.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {message && <p className="rounded-lg bg-green-50 p-3 text-green-700">{message}</p>}

      <section className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Create Researcher Account</h2>
        <form onSubmit={createResearcher} className="grid gap-4 md:grid-cols-2">
          <input
            type="email"
            required
            placeholder="Researcher email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="rounded-lg border p-3"
          />
          <input
            type="password"
            required
            minLength={12}
            maxLength={128}
            placeholder="Password (minimum 12 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="rounded-lg border p-3"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 md:col-span-2"
          >
            Create Researcher
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-semibold">Registered Accounts</h2>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="p-3">
                    {user.role === 'Researcher' && (
                      <button
                        onClick={() => void changeStatus(user)}
                        className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-slate-200"
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
