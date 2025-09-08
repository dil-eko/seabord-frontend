import Image from "next/image";

export default function Figure({
  src, alt, caption, credit, priority,
}: {
  src: string; alt: string; caption?: string; credit?: string; priority?: boolean;
}) {
  return (
    <figure className="my-6">
      <div className="relative w-full rounded-xl overflow-hidden border aspect-[16/9]">
        <Image src={src} alt={alt} fill sizes="(min-width:1024px) 800px, 100vw" priority={priority} />
      </div>
      {(caption || credit) && (
        <figcaption className="mt-2 text-sm text-zinc-500">
          {caption}{credit ? ` — ${credit}` : ""}
        </figcaption>
      )}
    </figure>
  );
}