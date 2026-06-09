/** Trigger browser download of an Excel file from a same-origin API route. */
export async function downloadExcelFromApi(apiUrl: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(apiUrl, { method: "GET", credentials: "same-origin" });
  if (!res.ok) {
    let message = "Export failed.";
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      message = res.statusText || message;
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
