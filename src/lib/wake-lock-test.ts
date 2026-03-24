// Test Wake Lock API support
export function testWakeLockSupport(): {
  supported: boolean
  permissions: boolean
  error?: string
} {
  try {
    // Vérifier si Wake Lock est supporté
    if (!('wakeLock' in navigator)) {
      return {
        supported: false,
        permissions: false,
        error: 'Wake Lock API non supporté par ce navigateur'
      }
    }

    // Vérifier si les permissions sont disponibles
    if (!('permissions' in navigator)) {
      return {
        supported: true,
        permissions: false,
        error: 'API Permissions non disponible'
      }
    }

    return {
      supported: true,
      permissions: true
    }
  } catch (error) {
    return {
      supported: false,
      permissions: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Tester si on peut demander un wake lock
export async function requestTestWakeLock(): Promise<{
  success: boolean
  error?: string
  wakeLockActive?: boolean
}> {
  try {
    const support = testWakeLockSupport()
    if (!support.supported) {
      return { success: false, error: support.error }
    }

    const wakeLock = await (navigator as any).wakeLock.request('screen')

    // Tester si le wake lock est actif
    const isActive = !wakeLock.released

    // Relâcher immédiatement pour le test
    await wakeLock.release()

    return {
      success: true,
      wakeLockActive: isActive
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la demande de wake lock'
    }
  }
}