import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "UDA Cycling Club",
  description: "Дугуйн клубын удирдлагын систем",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
