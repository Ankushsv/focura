"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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
      <div className="min-h-screen bg-structured-putty text-structured-ink flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="w-10 h-10 rounded-full border border-structured-ink flex items-center justify-center font-davinci font-bold text-lg mx-auto">
            F
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-structured-graphite">
            Navigating Focura Gateway...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-structured-putty text-structured-ink select-none lg:flex">
      
      {/* ── Left Pane: King's Oil Painting (Desktop Only) ── */}
      <div className="relative hidden lg:block w-1/2 h-screen overflow-hidden">
        {/* Full-bleed Renaissance King Portrait */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1576016770956-debb63d90029?auto=format&fit=crop&q=80&w=1200"
          alt="Classical oil painting of a king"
          className="w-full h-full object-cover filter grayscale-[20%] contrast-[1.05] brightness-[0.7]"
        />
        {/* Gallery ambient overlays */}
        <div className="absolute inset-0 bg-[#3a3528]/15 mix-blend-color-burn" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-structured-putty/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-structured-ink/40" />

        {/* Floating Editorial Quote Tag */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-8 left-8 z-10 max-w-sm bg-structured-ink/90 text-structured-paper p-6"
          style={{
            clipPath: "polygon(15px 0%, calc(100% - 15px) 0%, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0% calc(100% - 15px), 0% 15px)",
          }}
        >
          <span className="font-mono text-[8px] uppercase tracking-widest text-structured-paper/40 block mb-1">
            CHRONICLE VII // ROYAL COVENANT
          </span>
          <p className="font-davinci italic text-lg leading-snug">
            &ldquo;Discipline is the crown of the stormborn. Heavy is the head that wears no focus.&rdquo;
          </p>
        </motion.div>
      </div>

      {/* ── Right Pane: Form Area (Putty Canvas) ── */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-structured-putty">
        
        {/* Minimal Header */}
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full border border-structured-ink flex items-center justify-center font-davinci font-bold text-lg leading-none transition-transform group-hover:rotate-12 duration-300">
              F
            </div>
            <span className="font-helvetica-now font-bold text-xs uppercase tracking-widest">
              Focura
            </span>
          </Link>

          <Link 
            href="/"
            className="font-helvetica-now text-[9px] uppercase tracking-widest text-structured-graphite hover:text-structured-ink transition-colors hover:underline"
          >
            Return Home
          </Link>
        </header>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-12 space-y-8">
          
          {/* Circled Title Icon */}
          <div className="w-12 h-12 rounded-full border border-structured-ink flex items-center justify-center font-davinci font-bold text-xl mb-4">
            F
          </div>

          <div className="space-y-2 text-left">
            <h1 className="font-davinci text-4xl sm:text-5xl font-medium tracking-tight uppercase leading-none text-structured-ink">
              {mode === "login" ? "Enter the Great Hall" : "Swear the Oath"}
            </h1>
            <p className="font-davinci italic text-xs text-structured-graphite">
              {mode === "login" 
                ? "Prepare for your odyssey, ADHD warrior. Your longship awaits." 
                : "Bind thy focus. Earn thy shields. Swear Consistency."
              }
            </p>
          </div>

          {!configured ? (
            <div className="text-xs leading-relaxed text-structured-graphite p-4 border border-structured-ink bg-structured-bone rounded-[9px]">
              <p>
                Supabase configuration keys are missing. Populate <code>.env.local</code> to raise the sails.
              </p>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              {/* Google OAuth Option */}
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-full border border-structured-ink text-structured-ink font-helvetica-now font-bold hover:bg-structured-ink hover:text-structured-paper active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
              >
                <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="font-helvetica-now text-xs uppercase tracking-wider">Sail with Google</span>
              </button>

              {/* Visual Divider */}
              <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-structured-ink/10"></div>
                </div>
                <span className="relative z-10 px-3 bg-structured-putty text-[9px] uppercase tracking-widest text-structured-graphite font-mono">
                  OR BY CUSTOM CREW
                </span>
              </div>

              {/* Main Credentials Form */}
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-helvetica-now font-bold uppercase tracking-widest text-structured-graphite mb-1.5 ml-1">
                    Raid Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="warrior@fjord.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-full border border-structured-ink bg-transparent px-6 py-3.5 text-xs text-structured-ink placeholder-structured-graphite/40 focus:outline-none focus:ring-1 focus:ring-structured-ink transition-all font-helvetica-now"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-helvetica-now font-bold uppercase tracking-widest text-structured-graphite mb-1.5 ml-1">
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
                    className="w-full rounded-full border border-structured-ink bg-transparent px-6 py-3.5 text-xs text-structured-ink placeholder-structured-graphite/40 focus:outline-none focus:ring-1 focus:ring-structured-ink transition-all font-helvetica-now"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-[#f43f5e] bg-[#f43f5e]/5 border border-[#f43f5e]/10 rounded-[9px] p-2.5 text-center font-mono">
                    ⚠️ {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-structured-ink text-structured-paper font-helvetica-now font-bold uppercase tracking-widest hover:bg-structured-graphite active:scale-[0.98] transition-all disabled:opacity-50 duration-300"
                >
                  {loading ? "Aligning Stars..." : mode === "login" ? "Enter the Great Hall ⚔" : "Swear the Oath 🪓"}
                </button>
              </form>

              {/* Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                disabled={loading}
                className="text-xs text-structured-graphite hover:text-structured-ink transition duration-200 mt-2 block mx-auto underline underline-offset-4"
              >
                {mode === "login"
                  ? "New warrior? Register for Valhalla"
                  : "Already in the crew? Return to the Hall"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="font-mono text-[9px] text-structured-graphite tracking-widest uppercase">
            FOCURA &copy; {new Date().getFullYear()} &middot; ARCHITECTED IN MONTREAL FOR ADHD COGNITION
          </p>
        </footer>

      </div>

    </main>
  );
}
