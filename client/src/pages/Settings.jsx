import { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { updateProfile, changePassword } from '../services/userService';
import { passwordError } from '../utils/password';

// OWNER: Leader
// Sections: profile, security (change password), preferences (dark mode, notifications)

const roleLabel = (role) => (role ? role[0].toUpperCase() + role.slice(1) : '—');

// Monochrome switch built from tokens (no kit Switch yet); global :focus-visible gives the ring.
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[120ms] ${checked ? 'bg-ink' : 'bg-line'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-all duration-[120ms] ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

function PreferenceRow({ title, text, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-soft">{text}</p>
      </div>
      {children}
    </div>
  );
}

// Unexpected server/network errors that aren't tied to a single field.
function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-sm bg-out-soft px-3 py-2 text-[13px] text-out" role="alert">
      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { prefs, setPref } = usePreferences();

  // profile form
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [show, setShow] = useState(false);

  const setProfileField = (key, value) => {
    setProfile((p) => ({ ...p, [key]: value }));
    setProfileErrors((p) => ({ ...p, [key]: undefined }));
    setProfileError('');
  };

  const setPwField = (key, value) => {
    setPw((p) => ({ ...p, [key]: value }));
    setPwErrors((p) => ({ ...p, [key]: undefined }));
    setPwError('');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profile.name.trim()) errors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) errors.email = 'Enter a valid email';
    setProfileErrors(errors);
    setProfileError('');
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      const { user: saved } = await updateProfile({ name: profile.name.trim(), email: profile.email.trim() });
      updateUser({ name: saved.name, email: saved.email }); // keep the shell identity in sync
      setProfile({ name: saved.name, email: saved.email });
      toast.success('Profile updated');
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 409) {
        setProfileErrors({ email: err.message }); // duplicate email, verbatim
      } else if (Array.isArray(data?.errors)) {
        const fieldErrors = {};
        for (const item of data.errors) {
          if (item.field === 'name') fieldErrors.name = item.message;
          if (item.field === 'email') fieldErrors.email = item.message;
        }
        setProfileErrors(fieldErrors);
      } else {
        setProfileError(err.message);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!pw.current) errors.current = 'Enter your current password';
    const nextError = passwordError(pw.next, 'New password');
    if (nextError) errors.next = nextError;
    if (pw.confirm !== pw.next) errors.confirm = 'Passwords do not match';
    setPwErrors(errors);
    setPwError('');
    if (Object.keys(errors).length > 0) return;

    setSavingPw(true);
    try {
      const { token } = await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      if (token) localStorage.setItem('token', token); // server bumps tokenVersion; the old token stops working
      setPw({ current: '', next: '', confirm: '' });
      setShow(false);
      toast.success('Password changed');
    } catch (err) {
      const data = err.response?.data;
      if (Array.isArray(data?.errors)) {
        const fieldErrors = {};
        for (const item of data.errors) {
          if (item.field === 'currentPassword') fieldErrors.current = item.message;
          if (item.field === 'newPassword') fieldErrors.next = item.message;
        }
        setPwErrors(fieldErrors);
      } else if (err.response?.status === 400) {
        setPwErrors({ current: err.message }); // "Current password is incorrect", verbatim
      } else {
        setPwError(err.message);
      }
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="max-w-[640px] space-y-5">
        <Card className="rise" style={{ '--i': 1 }}>
          <h2 className="text-base font-semibold text-ink">Profile</h2>
          <p className="mt-1 text-sm text-ink-soft">Your name and email shown across the app.</p>
          <form onSubmit={saveProfile} className="mt-4 space-y-4" noValidate>
            <FormField label="Name" error={profileErrors.name}>
              <Input
                value={profile.name}
                required
                autoComplete="name"
                onChange={(e) => setProfileField('name', e.target.value)}
              />
            </FormField>
            <FormField label="Email" error={profileErrors.email}>
              <Input
                type="email"
                value={profile.email}
                autoComplete="email"
                onChange={(e) => setProfileField('email', e.target.value)}
              />
            </FormField>
            <div>
              <p className="mb-1 text-sm font-medium text-ink">Role</p>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{roleLabel(user.role)}</Badge>
                <span className="text-xs text-ink-soft">Read-only</span>
              </div>
            </div>
            <FormError message={profileError} />
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={savingProfile}>Save profile</Button>
            </div>
          </form>
        </Card>

        <Card className="rise" style={{ '--i': 2 }}>
          <h2 className="text-base font-semibold text-ink">Security</h2>
          <p className="mt-1 text-sm text-ink-soft">Change the password you use to sign in.</p>
          <form onSubmit={savePassword} className="mt-4 space-y-4" noValidate>
            <FormField label="Current password" error={pwErrors.current}>
              <Input
                type="password"
                value={pw.current}
                autoComplete="current-password"
                onChange={(e) => setPwField('current', e.target.value)}
              />
            </FormField>
            <FormField label="New password" error={pwErrors.next}>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={pw.next}
                  autoComplete="new-password"
                  className="pr-10"
                  onChange={(e) => setPwField('next', e.target.value)}
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
            <FormField label="Confirm new password" error={pwErrors.confirm}>
              <Input
                type="password"
                value={pw.confirm}
                autoComplete="new-password"
                onChange={(e) => setPwField('confirm', e.target.value)}
              />
            </FormField>
            <FormError message={pwError} />
            <p className="flex items-start gap-1.5 text-xs text-ink-soft">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Other devices will need to sign in again.</span>
            </p>
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={savingPw}>Change password</Button>
            </div>
          </form>
        </Card>

        <Card className="rise" style={{ '--i': 3 }}>
          <h2 className="text-base font-semibold text-ink">Preferences</h2>
          <div className="mt-2 divide-y divide-line">
            <PreferenceRow title="Dark mode" text="Applies to every page on this device.">
              <Toggle label="Dark mode" checked={prefs.darkMode} onChange={(v) => setPref('darkMode', v)} />
            </PreferenceRow>
            <PreferenceRow title="Notifications" text="Show the unread badge on the bell.">
              <Toggle label="Notifications" checked={prefs.notifications} onChange={(v) => setPref('notifications', v)} />
            </PreferenceRow>
          </div>
          <p className="mt-3 text-xs text-ink-soft">Preferences are stored on this device and synced to your account.</p>
        </Card>
      </div>
    </>
  );
}
