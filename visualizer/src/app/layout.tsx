import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Scribe Visualizer",
  description: "Analyze your productivity with screenshot insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="container" style={{ paddingTop: "24px", paddingBottom: "60px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
