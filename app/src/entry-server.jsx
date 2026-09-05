import { renderToString } from 'react-dom/server';
import App from './App';

/**
 * Server entry, used only at build time by prerender.js.
 *
 * The output is injected into dist/index.html so that crawlers — and
 * especially AI crawlers, none of which execute JavaScript — receive the
 * full page content in the initial HTML response.
 *
 * Anything in App that touches window/document must stay inside useEffect,
 * which does not run during renderToString.
 */
export function render() {
  return renderToString(<App />);
}
