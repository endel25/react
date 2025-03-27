import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

const VisitorForm = () => {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    date: '',
    allocatedTime: '',
    visitorEmail: '',
    national_id: '',
    photo: null,
    mobile_number: '',
    personal_details: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)
  const [isFormCompleted, setIsFormCompleted] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    const rawTime = searchParams.get('time') || ''
    let formattedTime = ''
    if (rawTime) {
      const timeParts = rawTime.split(' ')
      formattedTime = timeParts.length > 1 ? timeParts[0] : rawTime.split(':').slice(0, 2).join(':')
    }

    const initialData = {
      firstName: searchParams.get('firstName') || '',
      lastName: searchParams.get('lastName') || '',
      date: searchParams.get('date') || '',
      allocatedTime: formattedTime,
      visitorEmail: searchParams.get('email') || '',
    }
    setFormData((prev) => ({ ...prev, ...initialData }))

    const checkFormStatus = async () => {
      try {
        const response = await axios.get('http://192.168.3.74:3001/appointment/check-status', {
          params: {
            email: initialData.visitorEmail,
            date: initialData.date,
            time: initialData.allocatedTime,
          },
        })
        setIsFormCompleted(response.data.isFormCompleted)
      } catch (error) {
        console.error('Error checking form status:', error)
        setErrorMessage('Failed to check form status. Please try again.')
      }
    }
    checkFormStatus()

    // Add a class to hide everything except the form
    document.body.classList.add('hide-except-form')

    // Cleanup: Remove the class when component unmounts
    return () => {
      document.body.classList.remove('hide-except-form')
    }
  }, [searchParams])

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
      case 'national_id':
        if (value && !value.match(/^[a-zA-Z0-9]{4,}$/)) {
          error = 'National ID must be at least 4 characters (letters and numbers allowed)'
        }
        break
      case 'mobile_number':
        if (value && !value.match(/^\d+$/)) {
          error = 'Mobile number must contain only digits'
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
      case 'personal_details':
      case 'note':
        if (value && value.length < 2) {
          error = `${name.replace('_', ' ')} must be at least 2 characters`
        }
        break
      case 'photo':
        if (value && !value.type.match('image/(jpeg|png)')) {
          error = 'Please upload a JPEG or PNG image'
        }
        break
      default:
        break
    }
    return error
  }

  const handleChange = async (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    const error = validateField(name, value) // Fixed the typo here: removed the trailing "-"
    setErrors((prev) => ({ ...prev, [name]: error }))

    // Real-time validation for national_id
    if (name === 'national_id' && value && !error) {
      try {
        const response = await axios.get('http://192.168.3.74:3001/appointment/check-national-id', {
          params: { national_id: value },
        })
        if (response.data.exists) {
          setErrors((prev) => ({
            ...prev,
            national_id: 'This National ID is already used for another appointment.',
          }))
        }
      } catch (error) {
        console.error('Error checking national_id:', error)
        setErrors((prev) => ({
          ...prev,
          national_id: 'Failed to validate National ID. Please try again.',
        }))
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null
    setFormData((prev) => ({ ...prev, photo: file }))
    const error = validateField('photo', file)
    setErrors((prev) => ({ ...prev, photo: error }))
    setShowPhotoOptions(false)
  }

  const validateForm = () => {
    const newErrors = {}
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })
    ;['firstName', 'lastName', 'date', 'allocatedTime', 'visitorEmail'].forEach((key) => {
      if (!formData[key]) newErrors[key] = `${key.replace('_', ' ')} is required`
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if form is already submitted for this email, date, and time
    try {
      const response = await axios.get('http://192.168.3.74:3001/appointment/check-status', {
        params: {
          email: formData.visitorEmail,
          date: formData.date,
          time: formData.allocatedTime,
        },
      })
      if (response.data.isFormCompleted) {
        setIsFormCompleted(true)
        return
      }
    } catch (error) {
      console.error('Error checking form status before submission:', error)
      setErrorMessage('Failed to verify form status. Please try again.')
      return
    }

    if (!validateForm()) {
      setErrorMessage('Please fix all errors before submitting')
      return
    }

    // Additional check for national_id before submission
    if (formData.national_id) {
      try {
        const response = await axios.get('http://192.168.3.74:3001/appointment/check-national-id', {
          params: { national_id: formData.national_id },
        })
        if (response.data.exists) {
          setErrors((prev) => ({
            ...prev,
            national_id: 'This National ID is already used for another appointment.',
          }))
          setErrorMessage('This National ID is already used for another appointment.')
          return
        }
      } catch (error) {
        console.error('Error checking national_id before submission:', error)
        setErrorMessage('Failed to validate National ID. Please try again.')
        return
      }
    }

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    const formDataToSend = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        formDataToSend.append(key, value)
      }
    })

    try {
      const response = await axios.post(
        'http://192.168.3.74:3001/appointment/create',
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      console.log('Server response:', response.data)
      setSuccessMessage('Your Appointment Scheduled Successfully')
      setIsFormCompleted(true)
      setFormData({
        firstName: '',
        lastName: '',
        date: '',
        allocatedTime: '',
        visitorEmail: '',
        national_id: '',
        photo: null,
        mobile_number: '',
        personal_details: '',
        note: '',
      })
      setErrors({})
    } catch (error) {
      console.error('Error submitting appointment details:', error)
      const errorMsg =
        error.response?.data?.message || 'Failed to process request. Please try again.'
      setErrorMessage(errorMsg)
      if (error.response?.data?.message.includes('National ID')) {
        setErrors((prev) => ({
          ...prev,
          national_id: error.response.data.message,
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploadClick = () => {
    setShowPhotoOptions(true)
  }

  const handleChooseFromGallery = () => {
    fileInputRef.current.click()
  }

  const handleTakePhoto = () => {
    cameraInputRef.current.click()
  }

  // Render success or already submitted message
  if (isFormCompleted) {
    return (
      <div
        id="visitor-form"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#fff',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
            border: '1px solid #e0e0e0',
          }}
        >
          <h1
            style={{
              color: '#3f51b5',
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              borderBottom: '2px solid #3f51b5',
              paddingBottom: '0.5rem',
            }}
          >
            {successMessage || 'Your Appointment is Already Set'}
          </h1>
          <p style={{ fontSize: '1rem', color: '#666' }}>
            Please check your email for the QR code and further instructions.
          </p>
        </div>
      </div>
    )
  }

  // Render the form if not completed
  return (
    <div
      id="visitor-form"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        zIndex: 1000,
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
            color: '#333',
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
              { label: 'First Name', name: 'firstName', disabled: true },
              { label: 'Last Name', name: 'lastName', disabled: true },
              { label: 'Date', name: 'date', type: 'date', disabled: true },
              { label: 'Allocated Time', name: 'allocatedTime', type: 'time', disabled: true },
              { label: 'Email', name: 'visitorEmail', type: 'email', disabled: true },
              { label: 'National ID', name: 'national_id', type: 'text' },
              { label: 'Mobile Number', name: 'mobile_number', type: 'text' },
              { label: 'Personal Details', name: 'personal_details', type: 'textarea' },
              { label: 'Note', name: 'note', type: 'textarea' },
            ].map(({ label, name, type = 'text', disabled = false, onChange = handleChange }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <label
                    style={{ fontWeight: 'bold', fontSize: '1rem', color: '#333', width: '40%' }}
                  >
                    {label}
                  </label>
                  {type === 'textarea' ? (
                    <textarea
                      name={name}
                      value={formData[name]}
                      onChange={onChange}
                      disabled={disabled}
                      required={!disabled}
                      rows={3}
                      style={{
                        flex: 1,
                        padding: '12px 15px',
                        border: '2px solid',
                        borderColor: errors[name] ? 'red' : '#eee',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: '#f8f9fa',
                      }}
                    />
                  ) : (
                    <input
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={onChange}
                      disabled={disabled}
                      required={!disabled}
                      style={{
                        flex: 1,
                        padding: '12px 15px',
                        border: '2px solid',
                        borderColor: errors[name] ? 'red' : '#eee',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: '#f8f9fa',
                      }}
                    />
                  )}
                </div>
                {errors[name] && (
                  <span style={{ color: 'red', fontSize: '0.8rem', marginLeft: '40%' }}>
                    {errors[name]}
                  </span>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label style={{ fontWeight: 'bold', fontSize: '1rem', color: '333', width: '40%' }}>
                  Photo
                </label>
                <div style={{ flex: 1 }}>
                  <button
                    type="button"
                    onClick={handlePhotoUploadClick}
                    style={{
                      padding: '12px 15px',
                      border: '2px solid',
                      borderColor: errors.photo ? 'red' : '#eee',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: '#f8f9fa',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    Choose File
                  </button>
                  {showPhotoOptions && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleChooseFromGallery}
                        style={{
                          padding: '8px 12px',
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        Gallery
                      </button>
                      <button
                        type="button"
                        onClick={handleTakePhoto}
                        style={{
                          padding: '8px 12px',
                          background: '#764ba2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                        }}
                      >
                        Camera
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    name="photoFromFile"
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    name="photoFromCamera"
                    onChange={handleFileChange}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {errors.photo && (
                <span style={{ color: 'red', fontSize: '0.8rem', marginLeft: '40%' }}>
                  {errors.photo}
                </span>
              )}
              {formData.photo && (
                <span style={{ fontSize: '0.9rem', marginLeft: '40%', color: '#666' }}>
                  Selected: {formData.photo.name}
                </span>
              )}
            </div>
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
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {errorMessage && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'red', fontWeight: 'bold' }}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  )
}

// Inject CSS to hide everything except the form
const styleSheet = document.createElement('style')
styleSheet.type = 'text/css'
styleSheet.innerText = `
  .hide-except-form > *:not(#visitor-form) {
    visibility: hidden;
  }
  #visitor-form {
    visibility: visible !important;
  }
`
document.head.appendChild(styleSheet)

export default VisitorForm
