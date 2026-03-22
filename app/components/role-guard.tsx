
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { clearAccessToken, getAccessToken, getRoleIdFromToken, isTokenExpired } from '~/services/auth'

const roleRedirects: Record<number, string> = {
  1: '/customer',
  2: '/rider',
  3: '/restaurant',
  4: '/admin',
}

const canAccessRoleRoute = (requiredRoleId: number) => {
  const token = getAccessToken()

  if (!token || isTokenExpired(token)) {
    return {
      authorized: false,
      redirectTo: '/auth/signin',
      shouldClearToken: Boolean(token),
    }
  }

  const roleId = getRoleIdFromToken(token)

  if (!roleId) {
    return {
      authorized: false,
      redirectTo: '/auth/signin',
      shouldClearToken: true,
    }
  }

  if (roleId !== requiredRoleId) {
    return {
      authorized: false,
      redirectTo: roleRedirects[roleId] ?? '/auth/signin',
      shouldClearToken: false,
    }
  }

  return {
    authorized: true,
    redirectTo: '',
    shouldClearToken: false,
  }
}

export const useRoleGuard = (requiredRoleId: number) => {
  const navigate = useNavigate()
  const [guardState] = useState(() => canAccessRoleRoute(requiredRoleId))

  useEffect(() => {
    if (!guardState.authorized) {
      if (guardState.shouldClearToken) {
        clearAccessToken()
      }
      navigate(guardState.redirectTo, { replace: true })
    }
  }, [guardState, navigate])

  return guardState.authorized
}
