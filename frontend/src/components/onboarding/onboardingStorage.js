const STORAGE_PREFIX = 'qcode_onboarding_v1_'

function storageKey(email) {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`
}

export function isOnboardingComplete(email) {
  if (!email) return false
  return localStorage.getItem(storageKey(email)) === 'true'
}

export function markOnboardingComplete(email) {
  if (!email) return
  localStorage.setItem(storageKey(email), 'true')
}

export function resetOnboarding(email) {
  if (!email) return
  localStorage.removeItem(storageKey(email))
}
