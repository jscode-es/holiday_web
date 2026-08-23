"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ChecklistItem } from "@/lib/queries/checklist";
import { toggleChecklistItem } from "@/lib/actions/checklist";

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2">
          <Checkbox
            checked={item.done}
            onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
          />
          <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
