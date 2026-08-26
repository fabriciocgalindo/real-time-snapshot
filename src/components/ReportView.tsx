import { useMemo } from "react";

type Block =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; items: string[] }
  | { kind: "para"; text: string };


function isHeading(line: string): string | null {
  if (/^#{1,6}\s+/.test(line)) return line.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "");
  if (/^\[.+\]:?$/.test(line)) return line.replace(/^\[|\]:?$/g, "");
  // **Título** alone on a line, or short line ending with ":"
  if (/^\*\*[^*]+\*\*:?$/.test(line)) return line.replace(/\*\*/g, "").replace(/:$/, "");
  if (line.length < 60 && /^[\p{Lu}0-9][^.!?]*:$/u.test(line)) return line.replace(/:$/, "");
  return null;
}

/** Renders **bold** and `code` inline. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p))
          return (
            <strong key={i} className="font-semibold text-foreground">
              {p.slice(2, -2)}
            </strong>
          );
        if (/^`[^`]+`$/.test(p))
          return (
            <code
              key={i}
              className="bg-brand-soft rounded px-1.5 py-0.5 font-mono text-[0.85em] text-brand"
            >
              {p.slice(1, -1)}
            </code>
          );
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const heading = isHeading(line);
    if (heading) {
      blocks.push({ kind: "heading", text: heading });
      continue;
    }

    if (/^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "");
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "bullet") last.items.push(item);
      else blocks.push({ kind: "bullet", items: [item] });
      continue;
    }

    blocks.push({ kind: "para", text: line });
  }
  return blocks;
}

export function ReportView({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text]);
  const sectionCount = blocks.filter((b) => b.kind === "heading").length;
  let headingIndex = 0;

  return (
    <div className="space-y-5">
      {sectionCount > 0 && (
        <p className="font-display text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          {sectionCount} seções analisadas
        </p>
      )}

      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          headingIndex += 1;
          return (
            <div key={i} className="flex items-center gap-3 pt-3 first:pt-0">
              <span className="bg-gradient-brand text-brand-foreground font-display flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold">
                {headingIndex}
              </span>
              <h3 className="font-display text-lg font-bold">{block.text}</h3>
              <span className="bg-border h-px flex-1" />
            </div>
          );
        }

        if (block.kind === "bullet") {
          return (
            <ul key={i} className="space-y-2 pl-10">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-sm leading-relaxed text-foreground/90">
                  <span className="bg-brand mt-[0.45rem] size-1.5 shrink-0 rounded-full" />
                  <span>
                    <Inline text={item} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="pl-10 text-sm leading-relaxed text-foreground/80">
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
