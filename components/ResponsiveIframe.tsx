export default function ResponsiveIframe({
  src,
  title,
  aspect = "16/9",
  minVH,
}: {
  src: string;
  title: string;
  aspect?: "16/9" | "4/3";
  minVH?: number; // ör. 70 => min 70vh
}) {
  const aspectClass = aspect === "4/3" ? "aspect-[4/3]" : "aspect-[16/9]";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border ${aspectClass}`}
      style={minVH ? { minHeight: `${minVH}vh` } : undefined}
    >
      <iframe
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        loading="lazy"
        allowFullScreen
      />
    </div>
  );
}
