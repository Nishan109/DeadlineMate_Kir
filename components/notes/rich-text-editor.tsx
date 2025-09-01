"use client"

import * as React from "react"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  LinkIcon,
  Code,
  Type,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Simple, dependency-free rich text editor using contentEditable.
// Emits both HTML and plain text so callers can choose how to persist.
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your note content here...",
  className,
}: {
  value: string
  onChange: (html: string, plainText: string) => void
  placeholder?: string
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (ref.current && value !== undefined && ref.current.innerHTML !== value) {
      // Allow passing plain text as initial value; if it looks like HTML, it will render as-is
      ref.current.innerHTML = value || ""
    }
  }, [value])

  const emitChange = () => {
    const html = ref.current?.innerHTML ?? ""
    const text = ref.current?.innerText ?? ""
    onChange(html, text)
  }

  const exec = (cmd: string, showUI?: boolean, arg?: string) => {
    document.execCommand(cmd, showUI ?? false, arg)
    emitChange()
  }

  const applyHeading = (level: 1 | 2) => exec("formatBlock", false, level === 1 ? "H1" : "H2")

  const addLink = () => {
    const url = prompt("Enter URL")
    if (!url) return
    exec("createLink", false, url)
  }

  return (
    <div className={cn("w-full rounded-lg border bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <button type="button" aria-label="Undo" className="rounded-md p-2 hover:bg-muted" onClick={() => exec("undo")}>
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Redo" className="rounded-md p-2 hover:bg-muted" onClick={() => exec("redo")}>
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        <button
          type="button"
          aria-label="Heading 1"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => applyHeading(1)}
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => applyHeading(2)}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Normal Text"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("formatBlock", false, "P")}
        >
          <Type className="h-4 w-4" />
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        <button type="button" aria-label="Bold" className="rounded-md p-2 hover:bg-muted" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Italic"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Underline"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("underline")}
        >
          <Underline className="h-4 w-4" />
        </button>

        <div className="mx-2 h-5 w-px bg-border" />

        <button
          type="button"
          aria-label="Bulleted list"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("insertUnorderedList")}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("insertOrderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Insert link" className="rounded-md p-2 hover:bg-muted" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Inline code"
          className="rounded-md p-2 hover:bg-muted"
          onClick={() => exec("formatBlock", false, "PRE")}
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* Editor surface */}
      <div
        ref={ref}
        className="min-h-[220px] w-full resize-y bg-background p-4 text-sm leading-6 outline-none focus:outline-none"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        suppressContentEditableWarning
      />
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
