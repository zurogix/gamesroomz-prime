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

/** A filesystem-safe name such as "bubble-shooter-pvp-discovery". */
export function exportBaseName(gameName: string) {
  const base = gameName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "game"}-discovery`;
}
