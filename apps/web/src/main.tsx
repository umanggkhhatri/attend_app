import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
const App = lazy(() => import('./App'));
const Presentation = lazy(() => import('./presentation/Presentation'));
import './style.css';
import 'leaflet/dist/leaflet.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100dvh',
            background: '#182536',
            display: 'grid',
            placeItems: 'center',
            color: '#ccd9ec',
            fontFamily: 'sans-serif',
            fontSize: 13,
          }}
        >
          Opening OneAttend…
        </div>
      }
    >
      {location.pathname.replace(/\/$/, '') === '/presentation' ? <Presentation /> : <App />}
    </Suspense>
  </React.StrictMode>,
);
