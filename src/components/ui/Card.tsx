import type { CSSProperties } from "react";

export default function Card({
  className = "",
  style,
  onClick,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`glass ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
