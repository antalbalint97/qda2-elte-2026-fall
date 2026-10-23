"use client";

// R code editor: CodeMirror 6, loaded on demand. Until it has loaded (or if it fails) a plain labelled textarea
// edits the same text, so the block always works. Tab is not captured (it moves focus, as everywhere else on the
// site); Ctrl/Cmd + Enter runs the code.
import { useEffect, useRef, useState } from "react";

export function CodeEditor({ value, onChange, onRun, label, readOnly = false, minLines = 6 }: { value: string; onChange: (v: string) => void; onRun: () => void; label: string; readOnly?: boolean; minLines?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef({ onChange, onRun, value });
  latest.current = { onChange, onRun, value };
  const viewRef = useRef<{ destroy: () => void; state: { doc: { toString: () => string } }; dispatch: (tr: unknown) => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ EditorState }, { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection }, { defaultKeymap, history, historyKeymap }, { StreamLanguage, HighlightStyle, syntaxHighlighting, bracketMatching }, { r }, { tags }] = await Promise.all([
        import("@codemirror/state"),
        import("@codemirror/view"),
        import("@codemirror/commands"),
        import("@codemirror/language"),
        import("@codemirror/legacy-modes/mode/r"),
        import("@lezer/highlight"),
      ]);
      if (cancelled || !host.current) return;
      const style = HighlightStyle.define([
        { tag: tags.keyword, color: "var(--z-ink)" },
        { tag: [tags.string, tags.special(tags.string)], color: "var(--model-ink)" },
        { tag: tags.comment, color: "var(--muted)", fontStyle: "italic" },
        { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--y-ink)" },
        { tag: [tags.operator, tags.punctuation], color: "var(--ink)" },
      ]);
      const view = new EditorView({
        parent: host.current,
        state: EditorState.create({
          doc: latest.current.value,
          extensions: [
            lineNumbers(),
            history(),
            drawSelection(),
            highlightActiveLine(),
            bracketMatching(),
            StreamLanguage.define(r),
            syntaxHighlighting(style),
            EditorState.readOnly.of(readOnly),
            EditorView.editable.of(!readOnly),
            keymap.of([{ key: "Mod-Enter", run: () => (latest.current.onRun(), true) }, ...defaultKeymap, ...historyKeymap]),
            EditorView.contentAttributes.of({ "aria-label": label, "aria-multiline": "true" }),
            EditorView.updateListener.of((u) => {
              if (u.docChanged) latest.current.onChange(u.state.doc.toString());
            }),
            EditorView.theme({
              "&": { fontSize: "13px", backgroundColor: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: "8px" },
              "&.cm-focused": { outline: "2px solid var(--accent)", outlineOffset: "2px" },
              ".cm-content": { fontFamily: "var(--font-mono)", minHeight: `${minLines * 1.45}em`, caretColor: "var(--ink)" },
              ".cm-gutters": { backgroundColor: "var(--surface-2)", color: "var(--muted)", border: "none", borderRadius: "8px 0 0 8px" },
              ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)" },
              ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--ink)" },
              "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent)" },
            }),
          ],
        }),
      });
      viewRef.current = view as unknown as typeof viewRef.current;
      setReady(true);
    })().catch(() => {
      /* the textarea stays in use */
    });
    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // the editor is created once; later value changes from outside are pushed in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, label]);

  // external replacement of the text (an example snippet, Reset)
  useEffect(() => {
    const v = viewRef.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.toString().length, insert: value } });
  }, [value]);

  return (
    <div>
      <div ref={host} data-testid="r-editor" hidden={!ready} />
      {!ready && (
        <textarea
          aria-label={label}
          className="block w-full rounded-lg border border-line bg-surface p-2 font-mono text-[13px] text-ink"
          rows={Math.max(minLines, value.split("\n").length)}
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onRun();
            }
          }}
        />
      )}
    </div>
  );
}
