/** Saves text as a file via a Blob + object URL. Returns false if the browser refused. */
export function downloadText(filename: string, text: string, mimeType: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Lower-case letters, digits and single hyphens only, e.g. "Zoë's Game!" → "zo-s-game". */
export function slugify(text: string, fallback: string) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || fallback;
}

/** A filesystem-safe name such as "bubble-shooter-pvp-discovery". */
export function exportBaseName(gameName: string) {
  return `${slugify(gameName, "game")}-discovery`;
}

/**
 * "<game>-<who>-discovery-<YYYY-MM-DD>.md", e.g. "bubble-shooter-pvp-alex-smith-discovery-2026-09-26.md"
 * or "…-all-developers-discovery-…" for the combined export.
 */
export function discoveryFileName(gameName: string, who: string, date = new Date()) {
  return `${slugify(gameName, "game")}-${slugify(who, "developer")}-discovery-${date.toISOString().slice(0, 10)}.md`;
}

export const ALL_DEVELOPERS = "all developers";
