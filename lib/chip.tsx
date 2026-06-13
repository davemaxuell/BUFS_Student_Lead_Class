import { CSSProperties, ReactNode } from "react";

// A distinct color per token so boundaries are easy to see. Cycling the palette
// guarantees adjacent tokens never share a color. Shared by the first-part
// comparison and the live "Real tokenizers" panel so they look consistent.
const PALETTE = ["#7c9cff", "#58e0c8", "#ffb454", "#ff7a90", "#9b8cff", "#5fe08a", "#f2a8ff", "#67c7ff"];

export function chipStyle(i: number): CSSProperties {
  const c = PALETTE[i % PALETTE.length];
  return { background: c + "33", borderColor: c, color: "#f3f6ff" };
}

// A colored token chip with its 1-based position number underneath.
export function NumberedChip({
  i,
  broken,
  title,
  children,
}: {
  i: number;
  broken?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={"chip numbered" + (broken ? " broken" : "")}
      style={broken ? undefined : chipStyle(i)}
      title={title}
    >
      <span className="tok">{children}</span>
      <span className="idx">{i + 1}</span>
    </span>
  );
}
