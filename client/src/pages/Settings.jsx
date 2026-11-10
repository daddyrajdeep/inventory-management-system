import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import FormField, { inputClass } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { updateProfile, changePassword } from '../services/userService';

// OWNER: Leader
// Sections: profile, preferences (dark mode, notifications, language), change password

function Card({ title, subtitle, children }) {
  return (
    <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="mb-4 mt-1 text-sm text-gray-500">{subtitle}</p>}
      {children}
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  );
}

function PreferenceRow({ title, text, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{text}</p>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { prefs, setPref } = usePreferences();

  // profile form
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  // password form
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profile.name.trim()) errors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) errors.email = 'Enter a valid email';
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      const { user: saved } = await updateProfile(profile);
      updateUser({ name: saved.name, email: saved.email });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!pw.current) errors.current = 'Enter your current password';
    if (pw.next.length < 6) errors.next = 'At least 6 characters';
    if (pw.confirm !== pw.next) errors.confirm = 'Passwords do not match';
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="space-y-6">
        <Card title="Profile" subtitle="Your name and email shown across the app">
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <FormField label="Name" error={profileErrors.name}>
              <input
                className={inputClass}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </FormField>
            <FormField label="Email" error={profileErrors.email}>
              <input
                type="email"
                className={inputClass}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </FormField>
            <FormField label="Role">
              <input className={`${inputClass} capitalize opacity-70`} value={user.role} disabled />
            </FormField>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </Card>

        <Card title="Preferences">
          <div className="divide-y divide-gray-100">
            <PreferenceRow title="Dark mode" text="Easier on the eyes in low light">
              <Toggle label="Dark mode" checked={prefs.darkMode} onChange={(v) => setPref('darkMode', v)} />
            </PreferenceRow>
            <PreferenceRow title="Notifications" text="Show the unread badge on the bell">
              <Toggle label="Notifications" checked={prefs.notifications} onChange={(v) => setPref('notifications', v)} />
            </PreferenceRow>
            <PreferenceRow title="Language" text="Translations will be added later">
              <select
                value={prefs.language}
                onChange={(e) => setPref('language', e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="bn">Bengali</option>
              </select>
            </PreferenceRow>
          </div>
        </Card>

        <Card title="Change password">
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <FormField label="Current password" error={pwErrors.current}>
              <input
                type="password"
                className={inputClass}
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
              />
            </FormField>
            <FormField label="New password" error={pwErrors.next}>
              <input
                type="password"
                className={inputClass}
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
              />
            </FormField>
            <FormField label="Confirm new password" error={pwErrors.confirm}>
              <input
                type="password"
                className={inputClass}
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </FormField>
            <button
              type="submit"
              disabled={savingPw}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingPw ? 'Saving...' : 'Change password'}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
