"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type Mode = "login" | "register";

function errorKey(code?: string) {
  if (code === "INVALID_CREDENTIALS") return "invalidCredentials" as const;
  if (code === "USERNAME_TAKEN") return "usernameTaken" as const;
  if (code === "EMAIL_TAKEN") return "emailTaken" as const;
  if (code === "INVALID_INPUT") return "invalidInput" as const;
  return "genericError" as const;
}

export function AuthPanel() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body =
      mode === "login"
        ? { email: form.get("email"), password: form.get("password") }
        : {
            firstName: form.get("firstName"),
            lastName: form.get("lastName"),
            username: form.get("username"),
            email: form.get("email"),
            password: form.get("password"),
            locale,
          };

    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(t[errorKey(result.error)]);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(t.genericError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span className="eyebrow">DIVERPRO ACCESS</span>
        <h2>{mode === "login" ? t.welcome : t.create}</h2>
        <p>{mode === "login" ? t.welcomeSub : t.createSub}</p>
      </div>

      <div className="auth-tabs" role="tablist">
        <button className={mode === "login" ? "active" : ""} onClick={() => selectMode("login")} type="button">
          {t.signIn}
        </button>
        <button className={mode === "register" ? "active" : ""} onClick={() => selectMode("register")} type="button">
          {t.register}
        </button>
      </div>

      <button className="google-button" type="button" disabled title={t.unavailable}>
        <span className="google-g">G</span>
        <span>{t.continueGoogle}</span>
        <small>{t.unavailable}</small>
      </button>

      <div className="divider"><span>{t.orEmail}</span></div>

      <form onSubmit={submit} className="auth-form">
        {mode === "register" && (
          <div className="field-row">
            <label>
              <span>{t.firstName}</span>
              <span className="input-wrap"><UserRound size={17} /><input name="firstName" autoComplete="given-name" required maxLength={60} /></span>
            </label>
            <label>
              <span>{t.lastName}</span>
              <span className="input-wrap"><UserRound size={17} /><input name="lastName" autoComplete="family-name" required maxLength={60} /></span>
            </label>
          </div>
        )}

        {mode === "register" && (
          <label>
            <span>{t.username}</span>
            <span className="input-wrap"><UserRound size={17} /><input name="username" autoComplete="username" required minLength={3} maxLength={30} pattern="[a-zA-Z0-9._-]+" /></span>
            <small className="field-hint">{t.usernameHint}</small>
          </label>
        )}

        <label>
          <span>{t.email}</span>
          <span className="input-wrap"><Mail size={17} /><input name="email" type="email" autoComplete="email" required maxLength={254} /></span>
        </label>

        <label>
          <span className="label-line">
            <span>{t.password}</span>
            {mode === "login" && <span className="forgot-label">{t.forgot}</span>}
          </span>
          <span className="input-wrap">
            <LockKeyhole size={17} />
            <input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : 1} maxLength={128} />
            <button className="reveal" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
          {mode === "register" && <small className="field-hint">{t.passwordHint}</small>}
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="submit-button" type="submit" disabled={pending}>
          {pending ? (mode === "login" ? t.signingIn : t.creating) : (mode === "login" ? t.signIn : t.register)}
          {!pending && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <p className="auth-switch">
        {mode === "login" ? t.noAccount : t.hasAccount}{" "}
        <button type="button" onClick={() => selectMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? t.register : t.signIn}
        </button>
      </p>
      <p className="terms">{t.terms}</p>
    </div>
  );
}
