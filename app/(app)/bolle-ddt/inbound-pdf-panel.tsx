"use client";

import { useEffect, useState } from "react";

export function InboundPdfPanel() {
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <aside className="space-y-4 rounded-[8px] border border-border bg-card p-4 2xl:sticky 2xl:top-6">
      <div>
        <h2 className="font-semibold">PDF bolla</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carica il PDF e consultalo mentre compili i dati della bolla.
        </p>
      </div>

      <label className="block text-sm font-medium">
        File PDF
        <input
          accept="application/pdf"
          className="focus-ring mt-2 block w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm"
          name="previewPdf"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
            setPdfUrl(URL.createObjectURL(file));
            setFileName(file.name);
          }}
        />
      </label>

      <input name="attachmentName" readOnly type="hidden" value={fileName} />

      <div className="h-[78vh] min-h-[760px] overflow-hidden rounded-[8px] border border-border bg-muted">
        {pdfUrl ? (
          <iframe className="h-full w-full" src={pdfUrl} title="Anteprima PDF bolla" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Seleziona un PDF per visualizzarlo qui accanto al form.
          </div>
        )}
      </div>

      <details className="rounded-[8px] border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">Collegamento archivio</summary>
        <div className="mt-3 space-y-3">
          <input
            className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm"
            name="attachmentDriveFileId"
            placeholder="Google Drive file id"
          />
          <input
            className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm"
            name="attachmentUrl"
            placeholder="Link apertura Drive"
            type="url"
          />
        </div>
      </details>
    </aside>
  );
}
