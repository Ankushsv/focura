"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Auto-redirect if already authenticated
  useEffect(() => {
    async function checkUser() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/app");
        }
      } catch (err) {
        console.warn("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkUser();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      
      if (error) {
        setAuthError(error.message);
      } else {
        router.push("/app");
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setAuthError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setAuthError(error.message);
    } catch (err: any) {
      setAuthError(err.message || "OAuth redirection failed.");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070b0e] text-[#f5efe8] font-space flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="text-4xl">🛡️</div>
          <p className="text-xs uppercase tracking-widest text-[#52b3a1]">Navigating Fjord Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 bg-[#070b0e] overflow-hidden select-none">
      {/* Viking Theme Background Elements */}
      <div className="absolute inset-0 bg-radial-at-t from-[#0d2125] via-[#080d12] to-[#040608]" />
      
      {/* Auroral Glows */}
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-[130px] animate-pulse" style={{ animationDuration: "12s" }} />
      <div className="pointer-events-none absolute right-[-5%] bottom-[-5%] h-[550px] w-[550px] rounded-full bg-[#8b5cf6]/5 blur-[120px]" />

      {/* Floating Ash/Snow Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0f2d2b]/10 to-transparent" />

      <div className="relative z-10 w-full max-w-md bg-[#11161d]/85 backdrop-blur-lg border border-[#2d3a4b]/40 rounded-3xl p-8 shadow-2xl shadow-black/60 text-center space-y-6">
        {/* Runic Shield Icon */}
        <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-[#52b3a1]/20 to-transparent border border-[#52b3a1]/30 flex items-center justify-center text-3xl shadow-lg shadow-[#52b3a1]/10">
          🛡️
        </div>

        <div className="space-y-2">
          <h1 className="font-cinzel text-3xl font-extrabold uppercase tracking-wider text-[#f5efe8]">
            ENTER THE GREAT HALL
          </h1>
          <p className="font-lora italic text-xs text-[#52b3a1]/80">
            "Prepare for your odyssey, ADHD warrior. Your longship awaits."
          </p>
        </div>

        {!configured ? (
          <div className="text-sm leading-relaxed text-zinc-400 p-4 border border-[#ea580c]/30 bg-[#ea580c]/5 rounded-2xl">
            <p>
              Supabase configuration keys are missing. Populate <code>.env.local</code> to raise the sails.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Google OAuth Option */}
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-gradient-to-r from-[#215a51] to-[#123631] border border-[#52b3a1]/40 text-[#f5efe8] font-quick font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-black/40 disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>🛡️ Sail with Google</span>
            </button>

            {/* Visual Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2d3a4b]/30"></div>
              </div>
              <span className="relative z-10 px-3 bg-[#11161d] text-[10px] uppercase tracking-widest text-[#52b3a1]/60 font-mono">
                OR BY CUSTOM CREW
              </span>
            </div>

            <form onSubmit={submit} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#52b3a1] mb-1.5 ml-1">
                  Raid Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="warrior@fjord.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#2d3a4b]/60 bg-[#0c1015]/65 px-4 py-3 text-sm text-[#f5efe8] outline-none transition focus:border-[#52b3a1] placeholder-[#52b3a1]/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#52b3a1] mb-1.5 ml-1">
                  Oath Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#2d3a4b]/60 bg-[#0c1015]/65 px-4 py-3 text-sm text-[#f5efe8] outline-none transition focus:border-[#52b3a1] placeholder-[#52b3a1]/30"
                />
              </div>

              {authError && (
                <p className="text-xs text-[#f43f5e] bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-lg p-2.5 text-center">
                  ⚠️ {authError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] text-[#f5efe8] font-quick font-extrabold uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Aligning Stars..." : mode === "login" ? "Enter the Great Hall ⚔️" : "Swear the Oath 🪓"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              disabled={loading}
              className="text-xs text-[#52b3a1]/75 hover:text-[#f5efe8] transition duration-200 mt-2 block mx-auto underline underline-offset-4"
            >
              {mode === "login"
                ? "New warrior? Register for Valhalla"
                : "Already in the crew? Return to the Hall"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
