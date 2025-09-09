// app/page.tsx
import Image from "next/image";
import Link from 'next/link';

export const revalidate = 600;

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-14">
      <section className="mb-10">
        <h1 className="text-2xl font-semibold">
          Seabord — a digital gaze to the fortresses of eastern mediterranean.
        </h1>
        <p className="text-foreground/80 mt-3 max-w-2xl">
          Explore exhibitions that embed ArcGIS StoryMaps, read articles, and browse fortress records.
        </p>
      </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <Link href="/exhibitions" className="rounded-xl border overflow-hidden group">
             <div className="relative  aspect-[16/9]">
               <Image src="/home-exhibitions.jpg" alt="Exhibitions" fill sizes="(min-width:1024px) 33vw, 100vw"  priority />
              </div>
             <div className="p-4">
               <h2 className="font-semibold group-hover:underline">Exhibitions</h2>
               <p className="text-sm text-foreground/70 mt-1">Curated narratives & maps</p>
             </div>
            </Link>

            <Link href="/fortresses" className="rounded-xl border overflow-hidden group">
              <div className="relative h-40">
                 <Image src="/home-fortresses.jpg" alt="Fortresses" fill sizes="(min-width:1024px) 33vw, 100vw" />
             </div>
             <div className="p-4">
                 <h2 className="font-semibold group-hover:underline">Fortresses</h2>
                 <p className="text-sm text-foreground/70 mt-1">Catalog of sites & facts</p>
             </div>
            </Link>

            <Link href="/articles" className="rounded-xl border overflow-hidden group">
             <div className="relative h-40">
                <Image src="/home-articles.jpg" alt="Articles" fill sizes="(min-width:1024px) 33vw, 100vw" />
             </div>
             <div className="p-4">
                <h2 className="font-semibold group-hover:underline">Articles</h2>
                 <p className="text-sm text-foreground/70 mt-1">Long-form essays</p>
              </div>
            </Link>
          </section>

    </div>
  );
}