"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";
  
  const styles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-dim shadow-lg shadow-primary/25 hover:shadow-primary/40 btn-shimmer-sweep"
      : "border border-white/12 text-zinc-200 hover:bg-white/5 hover:border-white/25";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
