/** Client-side text extraction from PDF / DOCX / XLSX / plain-text files. */
export async function extractTextFromFiles(files: File[]): Promise<string> {
  let out = "";

  for (const file of files) {
    out += `\n\n=== CONTEÚDO DO ARQUIVO: ${file.name} ===\n\n`;
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          out +=
            content.items
              .map((i) => ("str" in i ? (i as { str: string }).str : ""))
              .join(" ") + "\n";
        }
      } else if (name.endsWith(".docx")) {
        const mammoth = (await import("mammoth/mammoth.browser.js" as string)) as {
          extractRawText: (i: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
        };
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        out += result.value;
      } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        for (const sheet of wb.SheetNames) {
          const ws = wb.Sheets[sheet];
          if (!ws) continue;
          out += `--- Aba: ${sheet} ---\n`;
          out += XLSX.utils.sheet_to_csv(ws) + "\n\n";
        }
      } else {
        out += await file.text();
      }
    } catch (err) {
      out += `(Erro ao ler arquivo: ${err instanceof Error ? err.message : String(err)})\n`;
    }
  }

  return out.trim();
}
