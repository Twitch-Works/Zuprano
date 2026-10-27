"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { useUI } from "@/stores/ui";

function ErrorNote({ message, small = false }: { message: string; small?: boolean }) {
  if (small) {
    return (
      <div className="bg-red-50 p-2.5 rounded-lg flex items-center gap-2 border border-red-200">
        <div className="w-1 h-1 bg-red-600 rounded-full flex-shrink-0" />
        <p className="text-[10px] font-medium text-red-700">{message}</p>
      </div>
    );
  }
  return (
    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-3 border border-red-100 mt-2">
      <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
      <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">{message}</p>
    </div>
  );
}

function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, resetPassword } = useAuth();
  const { closeAuthModal, showToast } = useUI();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setError("Please enter email and password");
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      showToast("success", "Welcome back!");
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      showToast("error", "Wrong email or password");
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    if (!email) return setError("Enter your email above, then tap Forgot?");
    try {
      await resetPassword(email);
      showToast("info", "Password reset link sent to " + email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-700 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-0 transition-all outline-none"
            placeholder="your@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-1">
            <label className="text-[11px] font-bold text-gray-700">Password</label>
            <button
              type="button"
              onClick={forgot}
              className="text-[10px] font-medium text-orange-600 hover:text-orange-700 transition-colors whitespace-nowrap"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm font-medium focus:bg-white focus:border-orange-500 focus:ring-0 transition-all outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>
      {error && <ErrorNote message={error} small />}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-black text-white rounded-lg text-sm font-bold uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-orange-600 disabled:opacity-50 mt-2"
      >
        {loading ? (
          <LoaderCircle className="animate-spin" size={16} />
        ) : (
          <>
            Login <ArrowRight size={14} />
          </>
        )}
      </button>
      <p className="text-[10px] font-medium text-gray-500 text-center pt-1">
        New here?{" "}
        <button type="button" onClick={onSwitchToSignup} className="text-orange-600 font-bold hover:text-orange-700 transition-colors">
          Create Account
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { closeAuthModal, showToast } = useUI();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) return setError("Please fill all fields");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setError("");
    setLoading(true);
    try {
      const signedIn = await signup(form);
      if (signedIn) {
        showToast("success", "Account created successfully!");
      } else {
        showToast("info", "Check your email to confirm your account.");
      }
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      showToast("error", "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  const fieldCls =
    "w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-[12px] font-bold focus:bg-white focus:border-black focus:ring-0 transition-all outline-none";
  const labelCls = "text-[9px] font-black uppercase tracking-[0.2em] text-[#1d1d1f]";

  return (
    <form onSubmit={submit} className="space-y-4 animate-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelCls}>Full Name</label>
          <input name="name" type="text" value={form.name} onChange={onChange} className={fieldCls} placeholder="John Doe" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} className={fieldCls} placeholder="you@example.com" autoComplete="email" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={labelCls}>Phone Number</label>
          <input name="phone" type="tel" value={form.phone} onChange={onChange} className={fieldCls} placeholder="98765 43210" autoComplete="tel" />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Access Key</label>
          <input name="password" type="password" value={form.password} onChange={onChange} className={fieldCls} placeholder="••••••••" autoComplete="new-password" />
        </div>
      </div>
      {error && <ErrorNote message={error} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-orange-600 shadow-xl shadow-black/10 disabled:opacity-50 group mt-6"
      >
        {loading ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <>
            Complete Initialization <ShieldCheck size={16} />
          </>
        )}
      </button>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center pt-2">
        Already verified?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-black border-b border-black pb-0.5 hover:text-orange-600 hover:border-orange-600 transition-colors"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}

function OtpForm() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const { sendOtp, verifyOtp } = useAuth();
  const { closeAuthModal, showToast } = useUI();

  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, timer]);

  const request = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid phone number");
    setError("");
    setLoading(true);
    try {
      await sendOtp(phone);
      setStep("otp");
      setTimer(30);
      showToast("info", "OTP sent to " + phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(phone, otp);
      showToast("success", "Verified successfully!");
      closeAuthModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      showToast("error", "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      {step === "phone" ? (
        <form onSubmit={request} className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1d1d1f]">Phone Number</label>
            <div className="flex gap-4">
              <div className="flex items-center justify-center w-20 h-14 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-black">+91</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-xl px-4 text-[13px] font-bold focus:bg-white focus:border-black focus:ring-0 transition-all outline-none"
                placeholder="98765 43210"
              />
            </div>
          </div>
          {error && <ErrorNote message={error} />}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-black text-white rounded-xl text-[12px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-orange-600 shadow-xl shadow-black/10 group disabled:opacity-50"
          >
            {loading ? <LoaderCircle className="animate-spin" size={18} /> : <>Request Access Key <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-8">
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1d1d1f]">OTP sent to +91 {phone}</label>
              <div className="flex justify-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full max-w-[280px] h-20 bg-gray-50 border border-gray-100 rounded-[2rem] text-center text-4xl tracking-[0.5em] focus:bg-white focus:border-black focus:ring-0 transition-all outline-none font-black text-black"
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[9px] font-black text-[#86868b] uppercase tracking-widest">
                {timer > 0 ? (
                  <>
                    SECURE WINDOW CLOSES IN <span className="text-orange-600">{timer}S</span>
                  </>
                ) : (
                  <button type="button" onClick={() => request()} className="text-orange-600 hover:text-black">
                    RESEND ACCESS KEY
                  </button>
                )}
              </div>
            </div>
          </div>
          {error && <ErrorNote message={error} />}
          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full h-14 bg-black text-white rounded-xl text-[12px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-orange-600 shadow-xl shadow-black/10 disabled:opacity-30 group"
            >
              {loading ? <LoaderCircle className="animate-spin" size={18} /> : <>Verify Identity <ShieldCheck size={18} /></>}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="w-full h-10 text-[10px] font-black text-black uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              Change Node
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, showToast } = useUI();
  const signInWithProvider = useAuth((s) => s.signInWithProvider);
  const [tab, setTab] = useState<"login" | "signup" | "otp">("login");
  if (!isAuthModalOpen) return null;

  const close = () => {
    closeAuthModal();
    setTimeout(() => setTab("login"), 300);
  };

  const oauth = async (provider: "google" | "apple") => {
    try {
      await signInWithProvider(provider);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : `${provider} sign-in is not available`);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-auto">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in" onClick={close} />
      <div className="relative bg-white w-full max-w-[500px] h-auto max-h-[calc(100vh-32px)] sm:max-h-[calc(100vh-48px)] md:max-h-[calc(100vh-80px)] flex flex-col rounded-2xl overflow-hidden shadow-lg animate-in">
        <div className="w-full flex flex-col relative bg-white overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6 pb-0">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold uppercase text-black">
                  {tab === "login" ? "Login" : tab === "signup" ? "Sign Up" : "Verify"}
                </h3>
                <p className="text-xs sm:text-sm text-orange-600 font-medium mt-0.5">{tab === "login" ? "Welcome back!" : "Create your account"}</p>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="p-2 sm:p-2.5 lg:p-3 bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg mb-3 sm:mb-4">
              {(
                [
                  { id: "login", label: "Login" },
                  { id: "signup", label: "Sign Up" },
                  { id: "otp", label: "Phone OTP" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    tab === t.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 custom-scrollbar pb-4 sm:pb-6">
            <div className="animate-in">
              {tab === "login" && <LoginForm onSwitchToSignup={() => setTab("signup")} />}
              {tab === "signup" && <SignupForm onSwitchToLogin={() => setTab("login")} />}
              {tab === "otp" && <OtpForm />}
            </div>
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <span className="relative bg-white px-3 text-xs font-medium text-gray-400">Or</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(["google", "apple"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => oauth(p)}
                  className="flex items-center justify-center h-11 border border-gray-200 rounded-lg hover:border-black hover:bg-gray-50 transition-all font-medium text-sm capitalize"
                >
                  {p === "google" ? "Google" : "Apple"}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3 py-3 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-[250px] leading-relaxed">
                Your payment is safe and secure. 100% protected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
