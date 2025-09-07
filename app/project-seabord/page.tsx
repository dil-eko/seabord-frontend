// app/project-seabord/page.tsx
export const revalidate = 600;

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Project: Seabord</h1>
      <p className="mb-4">
        <strong>Seabord</strong> is an ongoing research initiative focused on the
        fortresses of the Eastern Mediterranean. It combines historical narratives,
        typologies, and GIS-based analysis to support scholarly work and storytelling.
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Scope &amp; objectives of the project</li>
        <li>Data model (fortresses, regions, origins, galleries)</li>
        <li>ArcGIS StoryMaps and Experiences embedded in Exhibitions</li>
        <li>Publication plan &amp; outreach</li>
      </ul>
      <p>
        For collaboration or sponsorship opportunities, please visit the{" "}
        <a className="underline" href="/contact">Contact</a> page.
      </p>
    </main>
  );
}
