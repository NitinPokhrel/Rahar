'use client'
import { useState } from 'react'
import Header from  '@/app/components/layout/Header'

export default function BecomeVendorPage() {
  const [form, setForm] = useState({
    business_name: '',
    phone_number: '',
    address: ''
  })

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = e => {
    e.preventDefault()
    console.log('Form Submitted:', form)
    // Call your POST /api/vendors/create here
    fetch('/api/vendors/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then(data => {
      console.log('Success:', data)
      // redirect  
      window.location.href = '/vendor/dashboard' // Redirect to vendor dashboard or another page
      // Handle success (e.g., show a success message, redirect, etc.)
    })
    .catch(error => {
      console.error('Error:', error)
      window.location.href = '/vendor/dashboard'
      // Handle error (e.g., show an error message)
    })

  }

  return (
    <>
    <Header />
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-white">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-center mb-6">Become a Vendor</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Business Name *</label>
            <input
              name="business_name"
              value={form.business_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Your store or business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="e.g. +977-9800000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="e.g. Mechinagar, Jhapa, Nepal"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 my-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-md"
          >
            Create Vendor Account
          </button>
        </form>
      </div>
    </main>
    </>
  )
}
