import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/motion-tokens.css";
import "@/styles/transitions.css";
import "@/styles/view-transitions.css";
import "@/styles/aceternity.css";
import { ToastHost } from "@/components/motion/toast";
import { AuthProvider } from "@/components/auth/session-provider";

export const metadata: Metadata = {
  title: "OpenNow — Service Operations Deck",
  description: "Self-hosted ITSM platform engine: incidents, changes, problems, SLAs, CMDB.",
};

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });
const ticket = JetBrains_Mono({ subsets: ["latin"], variable: "--font-ticket", weight: ["500", "700"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable} ${ticket.variable}`}>
      <body className="min-h-screen bg-background text-foreground">
        <AuthProvider>
          <ToastHost>{children}</ToastHost>
        </AuthProvider>
      </body>
    </html>
  );
}
