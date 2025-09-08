import Link from "next/link";

export const revalidate = 600;

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">About</h1>
      <p className="mb-4">
        Seabord explores the fortifications of the Eastern Mediterranean through
        historical sources, digital cartography, and curated narratives. This site
        brings together exhibitions, articles, and structured data to support research
        and public engagement.
      </p>
      <p className="mb-4">
        Our approach combines archival reading (e.g., Evliya Çelebi’s <em>Seyahatnâme</em>)
        with contemporary geospatial tools to contextualize water systems, urban fabrics,
        and military architectures across the region.
      </p>
      <p>
        You can browse{" "}
        <Link className="underline" href="/exhibitions">Exhibitions</Link>, read{" "}
        <Link className="underline" href="/articles">Articles</Link>, or explore
        <Link className="underline" href="/fortresses"> Fortresses</Link>.
      </p>
    </div>
  );
}