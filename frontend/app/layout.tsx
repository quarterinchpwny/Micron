import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/theme-context"

const notoSans = Noto_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans",
})

const notoSansMono = Noto_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-mono",
})

export const metadata: Metadata = {
  title: "Docker Compose Manager",
  description: "Terminal-style Docker Compose service manager",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoSansMono.variable} antialiased`}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
