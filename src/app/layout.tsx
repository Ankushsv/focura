import type { Metadata } from "next";
import { DM_Serif_Display, Inter, Space_Grotesk, Quicksand, Caveat, JetBrains_Mono, Permanent_Marker, Cinzel_Decorative, Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brush",
});
const cinzel = Cinzel_Decorative({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-cinzel",
});
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-lora",
});

export const metadata: Metadata = {
  title: "The Realm of Focura — For the Stormborn",
  description:
    "A legendary productivity journey built for the Stormborn. Fight The Fog, summon your Familiar, swear Consistency Oaths, and write your Chronicle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} ${spaceGrotesk.variable} ${quicksand.variable} ${caveat.variable} ${jetbrains.variable} ${permanentMarker.variable} ${cinzel.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
