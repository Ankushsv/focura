"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition focus:border-primary";

export default function LoginPage() {
  const router = useRouter();
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setAuthError(error.message);
    else router.push("/app");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="text-lg font-bold tracking-tight">
          focura<span className="text-primary">.</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        {!configured ? (
          <div className="mt-4 text-sm leading-relaxed text-zinc-400">
            <p>
              Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code> and add your project keys to enable auth.
            </p>
            <Link
              href="/app"
              className="mt-4 inline-block font-medium text-primary underline underline-offset-4"
            >
              Continue to the demo shell →
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT_CLASS}
              />
              {authError && <p className="text-sm text-priority-critical">{authError}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "One moment\u2026" : mode === "login" ? "Log in" : "Sign up"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="mt-4 text-sm text-zinc-400 transition hover:text-white"
            >
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Log in"}
            </button>
          </>
        )}
      </Card>
    </main>
  );
}
