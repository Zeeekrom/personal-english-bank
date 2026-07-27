import type { Metadata } from "next";
import { Navigation } from "../components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal English Bank",
  description: "A traceable personal English learning workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Navigation />
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
