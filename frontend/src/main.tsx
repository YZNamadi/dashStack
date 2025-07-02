import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN })
}

createRoot(document.getElementById("root")!).render(<App />);
