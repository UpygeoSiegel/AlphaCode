import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSP Ready",
  description: "AP Computer Science Principles mastery practice platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
