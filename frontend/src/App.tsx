import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import StatementPage from './pages/StatementPage'
import PixPage from './pages/PixPage'
import ReceiptPage from './pages/ReceiptPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/extrato"
            element={
              <ProtectedRoute>
                <StatementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pix"
            element={
              <ProtectedRoute>
                <PixPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comprovante"
            element={
              <ProtectedRoute>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
