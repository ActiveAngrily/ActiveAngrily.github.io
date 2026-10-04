import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const instrumentSans = localFont({
  src: "../public/fonts/instrument-sans-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "anant jamuar",
  description: "Anant Jamuar, a developer in Bengaluru. Creator of Red Letter and Curieon.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={instrumentSans.variable}><body>{children}</body></html>;
}
