import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationalId: '',
    email: '',
    allocationTime: '',
    date: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const parseQueryParams = () => {
      const hash = window.location.hash
      const queryString = hash.split('?')[1]
      if (!queryString) return

      const params = new URLSearchParams(queryString)
      const email = params.get('email') || ''
      const allocationTime = params.get('time') || ''
      const date = params.get('date') || ''

      setFormData((prev) => ({
        ...prev,
        email: decodeURIComponent(email),
        allocationTime: decodeURIComponent(allocationTime),
        date: decodeURIComponent(date),
      }))
    }

    parseQueryParams()
  }, [])

  const validateField = (name, value) => {
    let error = ''

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (value && !value.match(/^[a-zA-Z\s]{2,}$/)) {
          error = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters and contain only letters`
        }
        break
      case 'phone':
        if (value && !value.match(/^\d+$/)) {
          error = 'Phone number must contain only digits'
        }
        break
      case 'nationalId':
        if (value && !value.match(/^[a-zA-Z0-9]{4,}$/)) {
          error = 'National ID must be at least 4 characters (letters and numbers allowed)'
        }
        break
      case 'email':
        if (value && !value.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'allocationTime':
        if (value && formData.date) {
          const selectedDate = new Date(formData.date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          selectedDate.setHours(0, 0, 0, 0)

          if (selectedDate.getTime() === today.getTime()) {
            const [hours, minutes] = value.split(':').map(Number)
            const now = new Date()
            const currentHours = now.getHours()
            const currentMinutes = now.getMinutes()

            if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) {
              error = 'Allocation time cannot be in the past for today'
            }
          }
        }
        break
      case 'date':
        if (value) {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (selectedDate < today) {
            error = 'Date must be today or later'
          }
        }
        break
      default:
        break
    }
    return error
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))

    // Revalidate allocationTime when date changes
    if (name === 'date' && formData.allocationTime) {
      const timeError = validateField('allocationTime', formData.allocationTime)
      setErrors((prev) => ({ ...prev, allocationTime: timeError }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key])
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMessage('Please fix all errors before submitting')
      return
    }

    setLoading(true)
    setMessage('')

    const formattedDate = formData.date ? formData.date.split('-').reverse().join('-') : ''
    const formattedData = {
      ...formData,
      phoneNumber: formData.phone,
      date: formattedDate,
    }

    console.log('Sending Data:', formattedData)

    try {
      const response = await axios.post('http://192.168.3.74:3001/visitors', formattedData, {
        headers: { 'Content-Type': 'application/json' },
      })

      console.log('Response:', response.data)
      setMessage('Visitor data successfully submitted!')
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        nationalId: '',
        email: '',
        allocationTime: '',
        date: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Error:', error.response?.data || error.message)
      setMessage(`Error: ${error.response?.data?.message || 'Internal server error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'white',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '600px',
        }}
      >
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '1rem' }}>
          Personal Information
        </h1>
        {message && (
          <p
            style={{
              textAlign: 'center',
              color: message.includes('error') ? 'red' : 'green',
              fontWeight: 'bold',
            }}
          >
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}
          >
            {[
              { label: 'First Name', name: 'firstName' },
              { label: 'Last Name', name: 'lastName' },
              { label: 'Phone Number', name: 'phone' },
              { label: 'National ID', name: 'nationalId' },
              { label: 'Email ID', name: 'email' },
              { label: 'Date', name: 'date', type: 'date' },
              { label: 'Allocation Time', name: 'allocationTime', type: 'time' },
            ].map(({ label, name, type = 'text' }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <label
                    style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333', width: '40%' }}
                  >
                    {label}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '12px 15px',
                      border: '2px solid #eee',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      borderColor: errors[name] ? 'red' : '#eee',
                    }}
                  />
                </div>
                {errors[name] && (
                  <span style={{ color: 'red', fontSize: '0.8rem', marginLeft: '40%' }}>
                    {errors[name]}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(to right, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
          >
            {loading ? 'Sending...' : 'Send to Email'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
