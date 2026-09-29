"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Field,
  Icon,
  PageHeader,
  TextInput,
} from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

type Step = "choose" | "phone" | "otp" | "email";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const configured = isSupabaseConfigured();
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sb = getSupabase();

  const sendOtp = async () => {
    if (!sb) return;
    if (!/^\+\d{10,15}$/.test(phone.trim())) {
      setError(t("login.checkPhone"));
      return;
    }
    setBusy(true);
    setError("");
    const { error } = await sb.auth.signInWithOtp({ phone: phone.trim() });
    setBusy(false);
    if (error) setError(t("login.error"));
    else setStep("otp");
  };

  const verifyOtp = async () => {
    if (!sb) return;
    setBusy(true);
    setError("");
    const { error } = await sb.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: "sms",
    });
    setBusy(false);
    if (error) setError(t("login.error"));
    else router.replace("/");
  };

  const emailLogin = async () => {
    if (!sb || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t("login.error"));
      return;
    }
    setBusy(true);
    setError("");
    const { error } = await sb.auth.signInWithOtp({ email: email.trim() });
    setBusy(false);
    if (error) setError(t("login.error"));
  };

  return (
    <div className="px-5 pt-6 pb-10 max-w-md mx-auto">
      <PageHeader title={t("app.name")} subtitle={t("app.tagline")} onBack={() => router.back()} />

      <div className="mt-2 rounded-2xl bg-pine-900 text-cream-50 p-6 dark:bg-night-800">
        <h2 className="text-2xl font-bold">{t("login.title")}</h2>
        <p className="mt-1 text-sm opacity-80">{t("login.subtitle")}</p>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-600/20 dark:text-red-300 px-4 py-3 text-sm font-medium">
          {error}
        </p>
      ) : null}

      {!configured ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-ink-500 dark:text-night-400 flex items-start gap-2">
            <Icon name="info" size={18} className="mt-0.5 shrink-0" />
            {t("login.demoNote")}
          </p>
          <Button variant="primary" fullWidth size="lg" onClick={() => router.replace("/")}>
            {t("login.demo")}
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {step === "choose" && (
            <>
              <Button variant="primary" fullWidth size="lg" onClick={() => setStep("phone")}>
                {t("login.phone")}
              </Button>
              <div className="flex items-center gap-3 text-xs text-ink-400">
                <span className="h-px flex-1 bg-cream-300 dark:bg-night-700" />
                {t("login.or")}
                <span className="h-px flex-1 bg-cream-300 dark:bg-night-700" />
              </div>
              <Button variant="outline" fullWidth size="lg" onClick={() => setStep("email")}>
                {t("login.email")}
              </Button>
            </>
          )}

          {step === "phone" && (
            <div className="space-y-4">
              <Field label={t("login.phone")}>
                <TextInput
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </Field>
              <Button variant="primary" fullWidth size="lg" disabled={busy} onClick={sendOtp}>
                {t("login.sendOtp")}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setStep("choose")}>
                {t("common.back")}
              </Button>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <Field label={t("login.otp")}>
                <TextInput
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </Field>
              <Button variant="primary" fullWidth size="lg" disabled={busy || otp.length < 4} onClick={verifyOtp}>
                {t("login.verify")}
              </Button>
            </div>
          )}

          {step === "email" && (
            <div className="space-y-4">
              <Field label={t("login.email")}>
                <TextInput
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPh")}
                  inputMode="email"
                  autoComplete="email"
                />
              </Field>
              <Button variant="primary" fullWidth size="lg" disabled={busy} onClick={emailLogin}>
                {t("login.continueEmail")}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setStep("choose")}>
                {t("common.back")}
              </Button>
            </div>
          )}

          <Button variant="ghost" fullWidth onClick={() => router.replace("/")}>
            {t("login.demo")}
          </Button>
        </div>
      )}
    </div>
  );
}
