import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading, profileLoaded } = useAuth()
  const location = useLocation()

  if (loading) {
    console.log('ProtectedRoute: Loading...')
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ✅ If user exists but profile hasn't been fetched yet, show spinner
  // This handles slow network/Supabase queries
  if (!profileLoaded) {
    console.log('ProtectedRoute: Waiting for profile to load...')
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  // If user is logged in but has no profile or no username, they must onboard
  if ((!profile || !profile.username) && location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: User has no profile/username. Redirecting to onboarding.', {
      profile: profile?.username || 'null',
      pathname: location.pathname
    })
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
