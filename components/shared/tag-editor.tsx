"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TAG_COLORS, tagColorClassName, type Tag, type TagColor } from "@/lib/tags";

export function TagEditor({ tags, onChange }: { tags: Tag[]; onChange: (tags: Tag[]) => void }) {
  const [text, setText] = useState("");
  const [color, setColor] = useState<TagColor>("gray");

  function addTag() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange([...tags, { text: trimmed, color }]);
    setText("");
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                tagColorClassName(tag.color)
              )}
            >
              {tag.text}
              <button type="button" onClick={() => removeTag(i)} aria-label={`Quitar ${tag.text}`}>
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Nueva etiqueta…"
          className="h-8 flex-1"
        />
        <Button type="button" size="sm" variant="secondary" onClick={addTag}>
          Añadir
        </Button>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-medium text-neutral-500">Color</span>
        <div className="flex flex-1 items-center gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              aria-label={c.label}
              aria-pressed={color === c.value}
              className={cn(
                "size-5 shrink-0 rounded-full ring-offset-2 transition-all",
                tagColorClassName(c.value).split(" ")[0],
                color === c.value ? "ring-2 ring-neutral-900" : "ring-0"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
