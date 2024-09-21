import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <link href='https://fonts.googleapis.com/css?family=Rubik' rel='stylesheet'></link>
    <App />
  </StrictMode>,
)
