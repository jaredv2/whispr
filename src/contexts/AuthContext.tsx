import React, { useEffect, useState, useRef, useCallback } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContextInstance'
import type { AuthContextType } from './AuthContextInstance'
import { type Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

const getRedirectUrl = () => {
  if (import.meta.env.PROD) {
    return 'https://usewhispr.vercel.app/auth/callback'
  }
  return `${window.location.origin}/auth/callback`
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false) // ✅ Track if profile fetch completed
  const initializedRef = useRef(false)
  const initStartedRef = useRef(false)

  const fetchProfileData = useCallback(async (userId: string) => {
    try {
      console.log('fetchProfileData started for user:', userId)
      
      // ✅ Check localStorage cache first for instant load
      const cachedProfile = localStorage.getItem(`profile_${userId}`)
      if (cachedProfile) {
        console.log('Loaded profile from localStorage cache')
        return JSON.parse(cachedProfile) as Profile
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, created_at')
        .eq('id', userId)
        .single()

      console.log('fetchProfileData query completed. data:', !!data, 'error:', error?.code)

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error)
        }
        return null
      }
            
      // ✅ Cache the profile for future reloads
      if (data) {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data))
      }
      
      return data
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      return null
    }
  }, [])

  const updateCounterRef = useRef(0)

  const updateAuthState = useCallback(async (newSession: Session | null) => {
    const updateId = ++updateCounterRef.current
    const newUser = newSession?.user ?? null
    
    console.log('updateAuthState called with user:', newUser?.id, 'updateId:', updateId)
    
    if (newUser) {
      // ✅ Set user and session IMMEDIATELY.
      // This prevents ProtectedRoute from redirecting to /login while we fetch the profile.
      setSession(newSession)
      setUser(newUser)
      setLoading(true)
      setProfileLoaded(false) // Mark profile as not yet loaded
      
      const newProfile = await fetchProfileData(newUser.id)
      
      console.log('Profile fetch completed:', newProfile?.username, 'updateId:', updateId, 'current:', updateCounterRef.current)
      
      // If a newer update has started, ignore this one
      if (updateId !== updateCounterRef.current) {
        console.log('Ignoring outdated profile update')
        return
      }

      // ✅ Update profile and mark as initialized, regardless of timing
      setProfile(newProfile)
      setProfileLoaded(true) // Mark profile as loaded
      setLoading(false)
      initializedRef.current = true
    } else {
      // No session
      console.log('No user session, clearing auth state')
      setSession(null)
      setUser(null)
      setProfile(null)
      setProfileLoaded(true)
      setLoading(false)
      initializedRef.current = true
    }
  }, [fetchProfileData])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('initializeAuth started')
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.error('getSession error:', error)
        console.log('getSession returned session for:', session?.user?.id || 'null')
        
        if (!mounted) {
          console.log('Component unmounted after getSession, skipping auth state update')
          return
        }

        if (!initializedRef.current) {
          console.log('Calling updateAuthState from initializeAuth')
          await updateAuthState(session)
        } else {
          console.log('Already initialized, skipping updateAuthState')
        }
      } catch (err) {
        console.error('Error in initializeAuth:', err)
        if (mounted && !initializedRef.current) {
          initializedRef.current = true
          setLoading(false)
        }
      }
    }

    // ✅ Only start initialization once, even in Strict Mode
    if (!initStartedRef.current) {
      initStartedRef.current = true
      initializeAuth()
    }

    // ✅ Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth event:', event)

        // Skip INITIAL_SESSION and SIGNED_IN if we already handled initialization
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && initializedRef.current) {
          console.log('Skipping', event, ', already initialized')
          return
        }

        // For SIGNED_OUT, we can update immediately and clear everything
        if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT, clearing auth state')
          setSession(null)
          setUser(null)
          setProfile(null)
          setLoading(false)
          initializedRef.current = true
          return
        }

        // For SIGNED_IN or INITIAL_SESSION, update the auth state
        console.log('Calling updateAuthState from auth event:', event)
        await updateAuthState(session)
      }
    )

    // ✅ Safety fallback — if onAuthStateChange never fires (network issue etc)
    // stop the spinner after 5s so user isn't stuck forever
    const fallback = setTimeout(() => {
      if (mounted && !initializedRef.current) {
        console.log('Fallback timeout triggered, setting loading to false')
        initializedRef.current = true
        setLoading(false)
        setProfileLoaded(true) // Mark profile as "loaded" even if it failed
      }
    }, 5000)

    return () => {
      console.log('AuthContext effect cleanup')
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [updateAuthState])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getRedirectUrl(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // ✅ Clear cached profile on sign out
    if (user) {
      localStorage.removeItem(`profile_${user.id}`)
    }
    
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (user) {
      // ✅ Clear cache to force fresh fetch
      localStorage.removeItem(`profile_${user.id}`)
      const data = await fetchProfileData(user.id)
      setProfile(data)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    profileLoaded,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}