import React, { useEffect, useState, useRef } from 'react'
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
  const initializedRef = useRef(false) // ✅ prevent double-init

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null)
        } else {
          console.error('Error fetching profile:', error)
          setProfile(null)
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    // ✅ Single source of truth — onAuthStateChange fires immediately
    // with the existing session from localStorage on mount (INITIAL_SESSION event)
    // No need for a separate getSession call
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth event:', event)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        // ✅ Only set loading false once — after first event resolves
        if (!initializedRef.current) {
          initializedRef.current = true
          setLoading(false)
        }
      }
    )

    // ✅ Safety fallback — if onAuthStateChange never fires (network issue etc)
    // stop the spinner after 5s so user isn't stuck forever
    const fallback = setTimeout(() => {
      if (mounted && !initializedRef.current) {
        initializedRef.current = true
        setLoading(false)
      }
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [])

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
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}