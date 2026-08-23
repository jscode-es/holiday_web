"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir la imagen.");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) uploadFile(file);
  }

  function commitUrlDraft() {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setUrlDraft("");
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-32 w-full object-cover" />
        <Button
          type="button"
          size="icon-xs"
          variant="secondary"
          className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/80"
          onClick={() => onChange("")}
          aria-label="Quitar imagen"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-black bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
        )}
      >
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-neutral-400" />
        ) : (
          <UploadCloud className="size-5 text-neutral-400" />
        )}
        <p className="text-xs font-medium text-neutral-600">
          {uploading ? "Subiendo…" : "Arrastra una imagen aquí o haz clic para subirla"}
        </p>
        <p className="text-[11px] text-neutral-400">JPG, PNG, WEBP o GIF · máx. 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-neutral-100" />
        <span className="text-[11px] text-neutral-400">o pega una URL</span>
        <div className="h-px flex-1 bg-neutral-100" />
      </div>

      <Input
        type="url"
        placeholder="https://… (pulsa Enter)"
        value={urlDraft}
        onChange={(e) => setUrlDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitUrlDraft();
          }
        }}
        onBlur={commitUrlDraft}
      />
    </div>
  );
}
