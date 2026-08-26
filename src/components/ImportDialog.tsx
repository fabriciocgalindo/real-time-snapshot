import { useRef, useState } from "react";
import { Upload, FileText, X, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromFiles } from "@/lib/doc-extract";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze: (text: string) => void;
  busy: boolean;
};

const ACCEPT = ".pdf,.json,.md,.txt,.docx,.xlsx";

export function ImportDialog({ open, onOpenChange, onAnalyze, busy }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    setNames((prev) => [...prev, ...files.map((f) => f.name)]);
    setReading(true);
    try {
      const extracted = await extractTextFromFiles(files);
      setText((prev) => (prev ? `${prev}\n${extracted}` : extracted));
    } finally {
      setReading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Importar TAP e/ou ERU</DialogTitle>
          <DialogDescription>
            Envie os documentos ou cole o conteúdo. O PMO Guardian analisa e preenche o canvas.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-brand bg-brand-soft" : "border-border hover:border-brand"
          }`}
        >
          <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="font-display text-base font-semibold">
            Arraste e solte os arquivos aqui
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, DOCX, XLSX, JSON, MD ou TXT
          </p>
          <p className="mt-2 text-sm font-semibold text-brand">Ou clique para selecionar</p>
        </button>

        {names.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {names.map((n, i) => (
              <li
                key={`${n}-${i}`}
                className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
              >
                <FileText className="size-3.5 text-brand" />
                {n}
                <button
                  type="button"
                  aria-label={`Remover ${n}`}
                  onClick={() => setNames((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          ou cole o texto abaixo
        </p>

        <Textarea
          value={reading ? "Lendo arquivos..." : text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cole aqui o conteúdo de um documento existente, briefing ou requisitos do projeto..."
          className="h-28 resize-none"
        />

        <Button
          variant="brand"
          size="lg"
          className="w-full"
          disabled={busy || reading || !text.trim()}
          onClick={() => onAnalyze(text)}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Analisando...
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Analisar e preencher canvas
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
