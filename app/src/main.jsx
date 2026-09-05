import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const container = document.getElementById('root');

const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

// In production the HTML is prerendered at build time (see prerender.js), so
// the container already has markup and we hydrate it rather than throwing it
// away. In dev the container is empty, so we mount normally.
if (container.hasChildNodes()) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
