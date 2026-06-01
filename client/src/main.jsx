import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

import posthog from 'posthog-js'


const queryClient = new QueryClient()

posthog.init('phc_CWfQiwKxgZ5JZy3NEMX3Wy33Tng7s9Uvzo44yMfaxjqk', {
  api_host: 'https://eu.i.posthog.com',
  person_profiles: 'identified_only',
})


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
