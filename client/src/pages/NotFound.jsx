
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Home,
  ArrowLeft,
  SearchX,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem("stockflow-theme");
    return ["light", "dark", "system"].includes(saved)
      ? saved
      : "system";
  } catch {
    return "system";
  }
};

export default function NotFound() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(getSavedTheme);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const update = () => setSystemDark(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  const isDark =
    theme === "system" ? systemDark : theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const changeTheme = (value) => {
    setTheme(value);
    localStorage.setItem("stockflow-theme", value);
  };

  const themes = [
    [Sun, "Light", "light"],
    [Moon, "Dark", "dark"],
    [Monitor, "System", "system"],
  ];

  return (
    <main
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-20 transition-colors duration-300 ${
        isDark
          ? "bg-[#080d25] text-white"
          : "bg-[#f8f9ff] text-[#111a35]"
      }`}
    >
      {/* Background Effects */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-500/20 blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />

      {/* Theme Selector */}
      <div
        className={`absolute right-5 top-5 z-10 flex rounded-full border p-1 shadow-lg backdrop-blur-xl sm:right-8 sm:top-7 ${
          isDark
            ? "border-white/10 bg-[#101a38]/90"
            : "border-slate-200 bg-white/80"
        }`}
      >
        {themes.map(([Icon, label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeTheme(value)}
            title={`${label} mode`}
            aria-pressed={theme === value}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
              theme === value
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                : isDark
                  ? "text-slate-300 hover:bg-white/10"
                  : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <section className="relative w-full max-w-2xl text-center">

        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 text-white shadow-xl shadow-purple-500/30">
            <Boxes size={30} />
          </div>

          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight">
              StockFlow<sup className="text-xs">™</sup>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inventory Management
            </p>
          </div>
        </div>

        {/* 404 Illustration */}
        <div className="relative mx-auto mb-6 flex h-52 items-center justify-center">
          <div className="absolute h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="text-8xl font-black tracking-tighter text-violet-500 sm:text-9xl">
              4
            </span>

            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-purple-400/30 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-purple-600/30 sm:h-28 sm:w-28">
              <SearchX size={55} />
            </div>

            <span className="text-8xl font-black tracking-tighter text-fuchsia-500 sm:text-9xl">
              4
            </span>
          </div>
        </div>

        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.25em] text-violet-500">
          Page Not Found
        </p>

        <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
          Oops! Lost in StockFlow?
        </h2>

        <p
          className={`mx-auto mt-5 max-w-lg text-base leading-7 ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          The page you're looking for doesn't exist, may have been moved,
          or the URL might be incorrect.
        </p>

        {/* Buttons */}
        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-4 font-bold text-white shadow-xl shadow-purple-600/25 transition hover:-translate-y-1 hover:brightness-110"
          >
            <Home size={20} />
            Go to Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center justify-center gap-3 rounded-xl border px-7 py-4 font-bold transition hover:-translate-y-1 ${
              isDark
                ? "border-slate-700 bg-[#101a38] text-white hover:bg-slate-800"
                : "border-slate-300 bg-white text-slate-700 hover:bg-purple-50"
            }`}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>

        <p className="mt-12 text-xs text-slate-500">
          © {new Date().getFullYear()} StockFlow. Inventory made simpler.
        </p>
      </section>
    </main>
  );
}
