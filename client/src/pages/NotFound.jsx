import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Boxes, Home, Moon, Sun } from 'lucide-react';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import { usePreferences } from '../context/PreferencesContext';
import { APP_NAME } from '../config/navigation';

export default function NotFound() {
  const navigate = useNavigate();
  const { prefs, setPref } = usePreferences();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-20 text-ink">
      <div className="absolute right-5 top-5">
        <IconButton label="Toggle dark mode" onClick={() => setPref('darkMode', !prefs.darkMode)}>
          {prefs.darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
      </div>

      <div className="rise w-full max-w-md text-center">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-on-ink"><Boxes size={16} /></span>
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>

        <p className="mono num text-[64px] font-semibold leading-none tracking-tight text-ink">404</p>
        <h1 className="mt-4 text-[22px] font-semibold text-ink">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          The page you’re looking for doesn’t exist, may have been moved, or the URL is incorrect.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => navigate('/', { replace: true })}><Home size={16} /> Go to dashboard</Button>
          <Button variant="secondary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Go back</Button>
        </div>

        <p className="mt-12 text-xs text-ink-soft">{APP_NAME} · {new Date().getFullYear()}</p>
      </div>
    </main>
  );
}
