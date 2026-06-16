"use client";

import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-dim shadow-lg shadow-primary/25"
      : "border border-white/15 text-zinc-200 hover:bg-white/5";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
