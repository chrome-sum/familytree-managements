'use client'

import { useState } from 'react'
import { createAdmin } from '@/lib/actions-auth'

export default function InitDB() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')

  const handleInit = async () => {
    setStatus('Loading...')
    const res = await createAdmin(email, password)
    if (res.success) {
      setStatus('Admin created successfully! You can now delete this page.')
    } else {
      setStatus('Error: ' + res.error)
    }
  }

  return (
    <div className="p-20 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Initialize Admin</h1>
      <div className="flex flex-col gap-4 max-w-sm">
        <input 
          className="bg-zinc-800 p-2 border border-zinc-700 rounded" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          className="bg-zinc-800 p-2 border border-zinc-700 rounded" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button className="bg-white text-black p-2 font-bold rounded" onClick={handleInit}>Create Admin</button>
        {status && <p className="mt-4">{status}</p>}
      </div>
    </div>
  )
}
