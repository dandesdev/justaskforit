import type { GalleryNode } from "@/lib/tools";
import { gridColumns, picsumUrl } from "@/lib/style";

export function Gallery({ node }: { node: GalleryNode }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: gridColumns(node.style?.columns ?? Math.min(node.images.length, 3)),
      }}
    >
      {node.images.map((image, i) => (
        <figure key={i} style={{ margin: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picsumUrl(image.imageQuery)}
            alt={image.caption ?? image.imageQuery}
            loading="lazy"
            style={{
              width: "100%",
              aspectRatio: "3 / 2",
              objectFit: "cover",
              borderRadius: "var(--radius, 14px)",
              display: "block",
            }}
          />
          {image.caption && (
            <figcaption style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "0.45rem" }}>
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
