import React, { Suspense, useEffect, useState } from 'react'
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'
import './scss/examples.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// PrivateRoute component to protect routes
const PrivateRoute = ({ element: Element }) => {
  const isAuthenticated = !!localStorage.getItem('token')
  return isAuthenticated ? <Element /> : <Navigate to="/login" replace />
}

const App = () => {
  const [message, setMessage] = useState('')
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios
        .get('http://192.168.3.74:3001/users/message', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setMessage(response.data.message))
        .catch((error) => {
          console.error('Error fetching data:', error)
          if (error.response?.status === 401) {
            localStorage.removeItem('token') // Clear invalid token
            window.location.hash = '/login' // Redirect to login
          }
        })
    }
  }, [])

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route exact path="/login" name="Login Page" element={<Login />} />
          <Route exact path="/register" name="Register Page" element={<Register />} />
          <Route exact path="/404" name="Page 404" element={<Page404 />} />
          <Route exact path="/500" name="Page 500" element={<Page500 />} />

          {/* Protected Routes */}
          <Route path="*" element={<PrivateRoute element={DefaultLayout} />} />

          {/* Root Path Redirect */}
          <Route
            exact
            path="/"
            element={
              localStorage.getItem('token') ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
