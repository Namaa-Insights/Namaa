"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Process the reset token in the URL if it exists.
    if (window.location.hash.includes('access_token')) {
      supabase.auth.exchangeCodeForSession(window.location.hash).then(({ error }) => {
        if (error) {
          setError(error.message)
        }
      })
    }
  }, [supabase])

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Update the user's password using the authenticated recovery session.
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated successfully! Redirecting to login...')
      await supabase.auth.signOut()
      // Redirect to the login page after a brief delay.
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-96 h-auto bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-gray-900 dark:text-gray-100">
            Update Your Password
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center gap-4">
          {error && (
            <p className="text-red-600 text-sm text-center">
              {error}
            </p>
          )}
          {message && (
            <p className="text-green-600 text-sm text-center">
              {message}
            </p>
          )}
          <form onSubmit={handleUpdatePassword}>
            <div className="grid gap-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                New Password:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-md border-0 py-1.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
            >
              Update Password
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
