import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: 'hsl(222.2 84% 4.9%)',
          border: '1px solid hsl(217.2 32.6% 17.5%)',
          color: 'hsl(210 40% 98%)',
        },
      }}
    />
    <App />
  </StrictMode>,
)
