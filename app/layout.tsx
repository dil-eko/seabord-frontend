// app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Seabord",
    template: "%s | Seabord",
  },
  description: "a digital gaze to the fortresses of eastern mediterranean.",
  metadataBase: new URL("https://seabord-frontend.vercel.app"), // kendi domaininiz
  openGraph: {
    type: "website",
    siteName: "Seabord",
    url: "/",
    title: "Seabord",
    description: "a digital gaze to the fortresses of eastern mediterranean.",
    images: [
      { url: "/og-seabord-light.png", width: 1200, height: 630, alt: "Seabord" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-seabord-light.png"],
  },
  icons: { icon: "/favicon.ico" },
};

// (opsiyonel) tarayıcı adres çubuğu rengi / dark-light için
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)",  color: "#0a0a0a"  },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground font-sans antialiased">
        {/* Skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-background border rounded px-3 py-1 text-sm"
        >
          Skip to content
        </a>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
          <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label="Seabord home">
              <span className="sr-only">Seabord</span>
              {/* light/dark wordmark swap */}
              <img src="/brand/seabord-wordmark-light.png" alt="" className="h-18 w-auto brand-light" />
              <img src="/brand/seabord-wordmark-dark.png" alt="" className="h-18 w-auto brand-dark" />
            </Link>
            <div className="flex items-center gap-4">
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/">Home</Link>
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/about">About</Link>
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/articles">Articles</Link>
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/fortresses">Fortresses</Link>
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/exhibitions">Exhibitions</Link>
              <Link className="text-base hover:underline underline-offset-4 font-semibold" href="/project-seabord">Project: Seabord</Link>
            </div>
          </nav>
        </header>

        {/* Single main */}
        <main id="main" className="mx-auto max-w-6xl px-4 py-10">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">
                Sponsors
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                 {/* 1) Marie Skłodowska-Curie Actions (CORDIS proje sayfası) */}
                <a
                  href="https://cordis.europa.eu/project/id/101110752/en"
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col items-start gap-2"
                >
                 <img
                    src="/logos/msca.svg"  /* PNG’niz varsa uzantıyı değiştirin */
                    alt="Marie Skłodowska-Curie Actions (Project 101110752)"
                    className="h-8 w-auto dark:opacity-90"
                  />
                  <span className="text-xs text-gray-600 group-hover:underline">
                    Marie Skłodowska-Curie Actions
                  </span>
                </a>

                  {/* 2) The Cyprus Institute (logo + altında başlık ve APAC Labs linki) */}
                <div className="flex flex-col items-start gap-2">
                  <a
                    href="https://seabord.cyi.ac.cy"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center"
                  >
                    <img
                      src="/logos/cyprus-institute.svg" /* PNG ise uzantıyı değiştirin */
                      alt="The Cyprus Institute"
                      className="h-8 w-auto dark:opacity-90"
                    />
                  </a>
                  <div className="text-xs">
                    <a
                      href="https://seabord.cyi.ac.cy"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Seabord Project
                    </a>
                  <span className="mx-2 text-gray-400">•</span>
                  <a
                      href="https://apaclabs.cyi.ac.cy/news/seaboard-project"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                  >
                      APAC Labs
                  </a>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-foreground/70 mb-3">Quick Links</h2>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/articles">Recent Articles</Link></li>
                <li><Link className="hover:underline" href="/fortresses">Fortress Regions</Link></li>
                <li><Link className="hover:underline" href="/exhibitions">Exhibitions</Link></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-foreground/70 mb-3">Contact</h2>
              <p className="mb-2">For inquiries and collaboration:</p>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/contact">Contact form</Link></li>
              </ul>
            </section>
          </div>

          <div className="border-t">
            <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-foreground/70 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex items-center gap-3">
                 {/* EU-funded / MSCA logo */}
                 <img
                  src="/logos/funded-EU.svg"
                  alt="EU-funded — Marie Skłodowska-Curie Actions (Grant 101110752)"
                  className="h-8 w-auto dark:opacity-90"
                  loading="lazy"
                  decoding="async"
                 />
                  <span>© {new Date().getFullYear()} Seabord</span>
                </div>

                  <p className="leading-relaxed text-foreground/70">
                    This website is created as part of a MSCA PF project (2023–2025), which has received funding from the
                    European Union’s Horizon Europe research and innovation programme under the Marie Sklodowska-Curie
                    grant agreement: <span className="font-medium">101110752</span>.
                  </p>
                </div>{/* /.max-w-7xl */}
              </div>{/* /.border-t */}
            </footer>
          </body>
        </html>
      );
}