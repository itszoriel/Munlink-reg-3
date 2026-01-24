import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../lib/store'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAdminStore()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/', { replace: true })
      return
    }

    // Verify user has admin role
    const allowedRoles = ['municipal_admin', 'admin', 'superadmin', 'provincial_admin', 'barangay_admin']
    if (!allowedRoles.includes(user.role)) {
      console.error('Access denied: User is not an admin')
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const allowedRoles = ['municipal_admin', 'admin', 'superadmin', 'provincial_admin', 'barangay_admin']
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
