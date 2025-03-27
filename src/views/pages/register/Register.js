import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilPhone, cilHome } from '@coreui/icons'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2' // Import SweetAlert2

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log(formData)
      const response = await fetch('http://192.168.3.74:3001/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Replace alert with SweetAlert2
        await Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created successfully.',
          confirmButtonText: 'OK',
          timer: 3000, // Auto-close after 3 seconds (optional)
          timerProgressBar: true, // Show progress bar (optional)
        })
        setFormData({ name: '', email: '', phone: '', address: '', password: '' })
        navigate('/login')
      } else {
        console.error('Registration failed:', data)
        // Show error with SweetAlert2
        await Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: `Error: ${data.message || 'Unknown error'}`,
          confirmButtonText: 'Try Again',
        })
      }
    } catch (error) {
      console.error('Error:', error)
      // Show error with SweetAlert2
      await Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: 'Something went wrong. Check the console for details.',
        confirmButtonText: 'OK',
      })
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={7} xl={6}>
            <CCard className="mx-4">
              <CCardBody className="p-4">
                <CForm onSubmit={handleSubmit}>
                  <h1>Register</h1>
                  <p className="text-body-secondary">Create your account</p>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      name="name"
                      placeholder="Name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>@</CInputGroupText>
                    <CFormInput
                      name="email"
                      placeholder="Email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilPhone} />
                    </CInputGroupText>
                    <CFormInput
                      name="phone"
                      placeholder="Phone"
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilHome} />
                    </CInputGroupText>
                    <CFormInput
                      name="address"
                      placeholder="Address"
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      name="password"
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </CInputGroup>

                  <div className="d-grid">
                    <CButton type="submit" color="success">
                      Create Account
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register
