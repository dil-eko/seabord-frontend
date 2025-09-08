// app/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        {/* Accessibility: skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-background border rounded px-3 py-1 text-sm"
        >
          Skip to content
        </a>

        {/* Site header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
          <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link className="font-semibold" href="/">Seabord</Link>
            <div className="flex items-center gap-4">
              <Link className="text-sm hover:underline underline-offset-4" href="/">Home</Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/about">About</Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/articles">Articles</Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/fortresses">Fortresses</Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/exhibitions">Exhibitions</Link>
              <Link className="text-sm hover:underline underline-offset-4" href="/project-seabord">Project: Seabord</Link>
            </div>
          </nav>
        </header>

        {/* Single main only – ensure pages don't render their own <main> */}
        <main id="main" className="mx-auto max-w-6xl px-4 py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Sponsors</h2>
              <ul className="space-y-2">
                <li>
                  <a className="hover:underline" href="https://example.org" target="_blank" rel="noreferrer">
                    Example Foundation
                  </a>
                </li>
                <li>
                  <a className="hover:underline" href="https://example.edu" target="_blank" rel="noreferrer">
                    Example University
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Quick Links</h2>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/articles">Recent Articles</Link></li>
                <li><Link className="hover:underline" href="/fortresses">Fortress Regions</Link></li>
                <li><Link className="hover:underline" href="/exhibitions">Exhibitions</Link></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Contact</h2>
              <p className="mb-2">For inquiries and collaboration:</p>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/contact">Contact form</Link></li>
              </ul>
            </section>
          </div>

          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-gray-500 flex items-center justify-between">
              <span>© {new Date().getFullYear()} Seabord</span>
              <span>a digital gaze to the fortresses of eastern mediterranean.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}