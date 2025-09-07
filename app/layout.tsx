// app/layout.tsx
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Seabord",
  description: "a digital gaze to the fortresses of eastern mediterranean.",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm hover:underline underline-offset-4">
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const showBuild = process.env.NEXT_PUBLIC_SHOW_BUILD === "1";
  const build = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-gray-900">
        {/* A11Y: skip link */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white border rounded px-3 py-1 text-sm"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-semibold">Seabord</Link>
            <div className="flex items-center gap-4">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/about">About</NavLink>
              <NavLink href="/articles">Articles</NavLink>
              <NavLink href="/fortresses">Fortresses</NavLink>
              <NavLink href="/exhibitions">Exhibitions</NavLink>
              <NavLink href="/project-seabord">Project: Seabord</NavLink>
            </div>
          </nav>
        </header>

        <main id="main">{children}</main>

        <footer className="border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
            {/* Sponsors */}
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Sponsors</h2>
              <ul className="space-y-2">
                <li><a className="hover:underline" href="https://example.org" target="_blank" rel="noreferrer">Example Foundation</a></li>
                <li><a className="hover:underline" href="https://example.edu" target="_blank" rel="noreferrer">Example University</a></li>
                {/* Replace with real sponsors later */}
              </ul>
            </section>

            {/* Quick Links */}
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Quick Links</h2>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/articles">Recent Articles</Link></li>
                <li><Link className="hover:underline" href="/fortresses">Fortress Regions</Link></li>
                <li><Link className="hover:underline" href="/exhibitions">Exhibitions</Link></li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-600 mb-3">Contact</h2>
              <p className="mb-2">
                For inquiries and collaboration:
              </p>
              <ul className="space-y-2">
                <li><Link className="hover:underline" href="/contact">Contact form</Link></li>
                {/* Later: Embed Drupal Webform here, or link directly to it */}
              </ul>
              {showBuild && <p className="mt-4 text-xs text-gray-500">build: {build}</p>}
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
