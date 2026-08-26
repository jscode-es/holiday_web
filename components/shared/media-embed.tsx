import { cn } from "@/lib/utils";
import { youtubeEmbedUrl } from "@/lib/youtube";

export function MediaEmbed({ url, className }: { url: string; className?: string }) {
  const embedUrl = youtubeEmbedUrl(url);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-neutral-100", className)}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="Vídeo"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}
