// app/contact/page.tsx
"use client";

import { useState, FormEvent } from "react";

export default function Page() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Placeholder: wire to Webform or an API route later
    setSent(true);
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Contact</h1>

      <p className="mb-4">
        Prefer email? <a className="underline" href="mailto:info@example.org">info@example.org</a>
      </p>

      <form onSubmit={onSubmit} className="space-y-3 border rounded-xl p-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" required name="name" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" required type="email" name="email" />
        </div>
        <div>
          <label className="block text-sm mb-1">Message</label>
          <textarea className="w-full border rounded px-3 py-2" required name="message" rows={5} />
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">
          Send
        </button>
        {sent && <p className="text-green-700 text-sm mt-2">Thank you — we’ll get back to you.</p>}
      </form>

      <p className="text-xs text-gray-500 mt-3">
        Later we can embed your Drupal Webform here or wire this form to an email service.
      </p>
    </main>
  );
}
