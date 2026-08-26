export const TAG_COLORS = [
  { value: "gray", label: "Gris", className: "bg-neutral-500 text-white" },
  { value: "red", label: "Rojo", className: "bg-red-600 text-white" },
  { value: "orange", label: "Naranja", className: "bg-orange-600 text-white" },
  { value: "amber", label: "Ámbar", className: "bg-amber-600 text-white" },
  { value: "green", label: "Verde", className: "bg-emerald-600 text-white" },
  { value: "blue", label: "Azul", className: "bg-blue-600 text-white" },
  { value: "purple", label: "Morado", className: "bg-purple-600 text-white" },
  { value: "pink", label: "Rosa", className: "bg-pink-600 text-white" },
] as const;

export type TagColor = (typeof TAG_COLORS)[number]["value"];

export type Tag = { text: string; color: TagColor };

export function tagColorClassName(color: string): string {
  return TAG_COLORS.find((c) => c.value === color)?.className ?? TAG_COLORS[0].className;
}
