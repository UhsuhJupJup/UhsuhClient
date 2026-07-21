"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

export function NoteMarkdown({ content, fluid = false }: { content: string; fluid?: boolean }) {
  return (
    <div className={fluid ? "note-markdown note-markdown--fluid" : "note-markdown"}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
      >
        {content}
      </Markdown>
    </div>
  );
}
