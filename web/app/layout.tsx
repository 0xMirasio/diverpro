import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueMates — Your diving companion",
  description: "Plan, log and relive your scuba diving adventures.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
