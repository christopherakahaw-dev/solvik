import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens/index.css'
import './index.css'
import { App } from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

// App still reads useAuth, so the provider has to be here or the very first
// render throws and the error boundary is all anyone ever sees.
//
// Keeping it costs nothing now that accounts are gone: with no Supabase
// configured the context resolves straight to a guest session, so there is no
// login, no remote profile and no sync — which is what the README promises.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
