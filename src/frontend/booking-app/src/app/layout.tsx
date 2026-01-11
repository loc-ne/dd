import type { Metadata } from "next";
import { Lexend, Inter, Roboto_Mono, Manrope} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import LayoutWrapper from "@/components/LayoutWrapper";


const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});
const lexend = Lexend({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-lexend",
});
const manrope = Manrope({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-manrope",
});
export const metadata: Metadata = {
  title: "Newbie.com",
  description: "Online booking and management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${robotoMono.variable} antialiased`}
      >
        <AuthProvider>
          <Toaster position="top-center" />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
