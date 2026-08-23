/** Extracts the video ID from common YouTube URL formats (watch, youtu.be, shorts, embed). */
export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
