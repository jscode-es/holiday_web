"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Luggage, Pencil, Trash2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { isReadOnly } from "@/lib/env";
import {
  createBagItem,
  deleteBag,
  deleteBagItem,
  toggleBagItem,
  updateBagName,
} from "@/lib/actions/bags";
import type { BagWithItems } from "@/lib/queries/bags";

export function BagCard({ bag }: { bag: BagWithItems }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(bag.name);
  const [newItem, setNewItem] = useState("");
  const [confirmingDeleteBag, setConfirmingDeleteBag] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ id: number; label: string } | null>(null);
  const [, startTransition] = useTransition();
  const [items, setOptimisticPacked] = useOptimistic(bag.items, (state, { id, packed }: { id: number; packed: boolean }) =>
    state.map((i) => (i.id === id ? { ...i, packed } : i))
  );

  const packedCount = items.filter((i) => i.packed).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((packedCount / total) * 100) : 0;

  async function commitRename() {
    setRenaming(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === bag.name) {
      setName(bag.name);
      return;
    }
    await updateBagName(bag.id, trimmed);
    router.refresh();
  }

  async function handleDeleteBag() {
    await deleteBag(bag.id);
    router.refresh();
  }

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const label = newItem.trim();
    if (!label) return;
    setNewItem("");
    await createBagItem(bag.id, label);
    router.refresh();
  }

  return (
    <div className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <Luggage className="size-4" />
          </span>
          {renaming ? (
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
              }}
              className="h-8"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-neutral-900">{bag.name}</p>
          )}
        </div>
        {!isReadOnly && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon-xs" variant="ghost" onClick={() => setRenaming(true)} aria-label="Renombrar">
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={() => setConfirmingDeleteBag(true)} aria-label="Borrar maleta">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmingDeleteBag}
        onOpenChange={setConfirmingDeleteBag}
        title={`¿Borrar "${bag.name}" y todo su contenido?`}
        onConfirm={handleDeleteBag}
      />

      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between text-xs font-medium text-neutral-400">
          <span>
            {packedCount}/{total} preparado
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div
            className={cn("h-full rounded-full transition-all", percent === 100 ? "bg-emerald-500" : "bg-black")}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">Sin elementos todavía.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-neutral-50">
              <Checkbox
                checked={item.packed}
                disabled={isReadOnly}
                onCheckedChange={(checked) => {
                  const packed = checked === true;
                  startTransition(async () => {
                    setOptimisticPacked({ id: item.id, packed });
                    await toggleBagItem(item.id, packed);
                    router.refresh();
                  });
                }}
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.packed ? "text-neutral-400 line-through" : "text-neutral-700"
                )}
              >
                {item.label}
              </span>
              {!isReadOnly && (
                <button
                  onClick={() => setDeletingItem({ id: item.id, label: item.label })}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Borrar elemento"
                >
                  <X className="size-3.5 text-neutral-400 hover:text-rose-600" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={deletingItem != null}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title={`¿Borrar "${deletingItem?.label ?? ""}"?`}
        onConfirm={async () => {
          if (deletingItem == null) return;
          await deleteBagItem(deletingItem.id);
          router.refresh();
        }}
      />

      {!isReadOnly && (
        <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Añadir elemento…"
            className="h-8 flex-1"
          />
          <Button type="submit" size="icon-sm" variant="secondary" aria-label="Añadir">
            <Plus className="size-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
