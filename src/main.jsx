import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx' // Ye dusri file se App laye ga

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)