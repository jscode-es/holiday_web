"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { isReadOnly } from "@/lib/env";
import type { ChecklistItem } from "@/lib/queries/checklist";
import { toggleChecklistItem } from "@/lib/actions/checklist";

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2.5"
        >
          <Checkbox
            checked={item.done}
            disabled={isReadOnly}
            onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
          />
          <span className={`text-sm ${item.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
