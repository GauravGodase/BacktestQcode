import { lazy, Suspense, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import { DashboardSkeleton, LoginPageSkeleton, OnboardingTourSkeleton } from './components/ui/SectionSkeletons'
import { isOnboardingComplete, resetOnboarding } from './components/onboarding/onboardingStorage'

const LoginPage = lazy(() => import('./components/auth/LoginPage'))
const Dashboard = lazy(() => import('./components/layout/Dashboard'))
const OnboardingTour = lazy(() => import('./components/onboarding/OnboardingTour'))

function App() {
  const { user, bootstrapping, isAuthenticated } = useAuth()
  const [dashboardKey, setDashboardKey] = useState('default')
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setShowTour(!isOnboardingComplete(user.email))
    } else {
      setShowTour(false)
    }
  }, [isAuthenticated, user?.email])

  const handleReplayTour = () => {
    if (user?.email) resetOnboarding(user.email)
    setShowTour(true)
  }

  if (bootstrapping) {
    return <LoginPageSkeleton />
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoginPageSkeleton />}>
        <LoginPage />
      </Suspense>
    )
  }

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard
          key={dashboardKey}
          initialSection={dashboardKey === 'demo' ? 'strategy' : 'data'}
          onReplayTour={handleReplayTour}
        />
      </Suspense>
      {showTour && (
        <Suspense fallback={<OnboardingTourSkeleton />}>
          <OnboardingTour
            onComplete={() => setShowTour(false)}
            onSkip={() => setShowTour(false)}
            onTryDemo={() => setDashboardKey('demo')}
          />
        </Suspense>
      )}
    </>
  )
}

export default App
