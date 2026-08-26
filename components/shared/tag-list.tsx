import { cn } from "@/lib/utils";
import { tagColorClassName, type Tag } from "@/lib/tags";

export function TagList({ tags, className }: { tags: Tag[] | null | undefined; className?: string }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag, i) => (
        <span
          key={i}
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            tagColorClassName(tag.color)
          )}
        >
          {tag.text}
        </span>
      ))}
    </div>
  );
}
