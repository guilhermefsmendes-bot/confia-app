import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initLanguage } from './i18n/language';
import { AppErrorBoundary } from './components/AppErrorBoundary';
async function bootstrap() {
  // Carrega apenas o idioma escolhido e o fallback antes de mostrar a interface.
  await initLanguage();

  // App Check só é carregado quando existe uma chave configurada.
  // Assim, instalações sem esta proteção não descarregam código Firebase
  // que não vão utilizar; quando configurado, continua a iniciar antes do React.
  if (import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY) {
    const { initAppCheck } = await import('./firebaseAppCheck');
    initAppCheck();
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
