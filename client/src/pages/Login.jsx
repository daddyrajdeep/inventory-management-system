import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Boxes, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../services/authService';
import { APP_NAME } from '../config/navigation';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import IconButton from '../components/ui/IconButton';
import CopyButton from '../components/ui/CopyButton';

// OWNER: Leader
// Real login: sends email + password to POST /api/auth/login
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { token, user: loggedInUser } = await loginRequest(email.trim(), password);
      login(loggedInUser, token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Brand panel — the ledger cover (desktop only) */}
      <div className="relative hidden w-[55%] flex-col justify-between bg-ink p-12 text-on-ink lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-on-ink text-ink">
            <Boxes size={16} />
          </span>
          <span className="text-base font-semibold">{APP_NAME}</span>
        </div>

        <div className="rise" aria-hidden="true">
          <div className="max-w-sm rounded-md border border-on-ink/15 bg-surface p-5 text-ink shadow-float">
            <p className="mb-3 text-xs font-medium text-ink-soft">Stock card</p>
            <ul className="space-y-2.5">
              {[
                ['WM-001', 'Wireless Mouse', '120 pcs', 'bg-ok'],
                ['UC-002', 'USB-C Cable', '8 pcs', 'bg-low'],
                ['DL-004', 'Desk Lamp', '0 pcs', 'bg-out'],
              ].map(([sku, name, qty, dot], i) => (
                <li key={sku} className="rise flex items-center gap-3 text-[13px]" style={{ '--i': i + 1 }}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                  <span className="mono w-16 text-ink-soft">{sku}</span>
                  <span className="flex-1">{name}</span>
                  <span className="mono num">{qty}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3 text-base font-medium">Every unit accounted for.</div>
          </div>
        </div>

        <p className="text-xs text-on-ink/60">Inventory · Sales · Purchase orders</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="rise w-full max-w-[360px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-ink text-on-ink">
              <Boxes size={16} />
            </span>
            <span className="text-base font-semibold text-ink">{APP_NAME}</span>
          </div>

          <Link to="/welcome" className="mb-6 inline-block text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline">← Back to home</Link>
          <h1 className="text-[28px] font-semibold leading-[34px] text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-soft">Use your work account.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <FormField label="Email">
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" autoComplete="username" />
            </FormField>
            <FormField label="Password">
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <IconButton
                  label={show ? 'Hide password' : 'Show password'}
                  aria-pressed={show}
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              </div>
            </FormField>

            {error && (
              <div className="flex items-start gap-2 rounded-sm bg-out-soft px-3 py-2 text-[13px] text-out" role="alert" style={{ animation: 'rise 200ms var(--ease) both' }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 rounded-md border border-line bg-surface p-3">
              <p className="mb-2 text-xs font-medium text-ink-soft">Demo accounts (dev only)</p>
              <ul className="space-y-1.5">
                {[
                  ['admin@demo.com', 'Admin@123'],
                  ['priya@demo.com', 'Manager@123'],
                  ['rahul@demo.com', 'Staff@123'],
                ].map(([e, p]) => (
                  <li key={e} className="flex items-center gap-2 text-xs">
                    <span className="mono flex-1 text-ink">{e}</span>
                    <span className="mono text-ink-soft">{p}</span>
                    <CopyButton value={p} label={`Copy password for ${e}`} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-8 text-xs text-ink-soft">{APP_NAME} · {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
