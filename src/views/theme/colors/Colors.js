import React, { useState } from 'react'
import axios from 'axios'

function AppointmentForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    date: '',
    allocatedTime: '',
    visitorEmail: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const validateField = (name, value) => {
    let error = ''

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (value && !value.match(/^[a-zA-Z\s]{2,}$/)) {
          error = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters and contain only letters`
        }
        break
      case 'visitorEmail':
        if (value && !value.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'allocatedTime':
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))

    // Revalidate allocatedTime when date changes
    if (name === 'date' && formData.allocatedTime) {
      const timeError = validateField('allocatedTime', formData.allocatedTime)
      setErrors((prev) => ({ ...prev, allocatedTime: timeError }))
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
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    if (!validateForm()) {
      setErrorMessage('Please fix all errors before submitting.')
      setLoading(false)
      return
    }

    try {
      await axios.post('http://192.168.3.74:3001/appointment/create', formData, {
        headers: { 'Content-Type': 'application/json' },
      })
      setSuccessMessage(
        `Appointment for ${formData.firstName} ${formData.lastName} scheduled successfully! Email sent to ${formData.visitorEmail}.`,
      )
      setFormData({
        firstName: '',
        lastName: '',
        date: '',
        allocatedTime: '',
        visitorEmail: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Error:', error.response?.data || error.message)
      const errorMsg =
        error.response?.data?.message || 'Failed to process request. Please try again.'
      setErrorMessage(errorMsg)
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
        padding: '20px',
        background: 'white',
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
        <h1
          style={{
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '2rem',
            background: 'linear-gradient(to right, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Schedule an Appointment
        </h1>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}
          >
            {[
              { label: 'First Name', name: 'firstName' },
              { label: 'Last Name', name: 'lastName' },
              { label: 'Date', name: 'date', type: 'date' },
              { label: 'Allocated Time', name: 'allocatedTime', type: 'time' },
              { label: 'Visitor Email', name: 'visitorEmail', type: 'email' },
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
                    required
                    min={name === 'date' ? new Date().toISOString().split('T')[0] : undefined}
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
              background: loading ? '#aaa' : 'linear-gradient(to right, #667eea, #764ba2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? 'Processing...' : 'Schedule Appointment'}
          </button>
        </form>

        {successMessage && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              color: '#28a745',
              fontWeight: 'bold',
              background: '#e6ffe6',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              color: '#dc3545',
              fontWeight: 'bold',
              background: '#ffe6e6',
              padding: '10px',
              borderRadius: '5px',
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  )
}

export default AppointmentForm
