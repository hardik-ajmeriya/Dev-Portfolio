import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App.jsx';
import './index.css';

// Inject Vercel Speed Insights for performance monitoring (client-side only)
injectSpeedInsights();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);