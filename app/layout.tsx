import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Color Field Admin",
  description: "Administration console for Color Field.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
