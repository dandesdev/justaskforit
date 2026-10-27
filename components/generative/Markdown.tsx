import ReactMarkdown from "react-markdown";

/**
 * Safe markdown renderer. react-markdown never renders raw HTML by default
 * (it is escaped as text), and we additionally constrain links to
 * http(s)/mailto and images to https.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <div className="gen-markdown">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const safe = typeof href === "string" && /^(https?:\/\/|mailto:)/i.test(href);
            if (!safe) return <span>{children}</span>;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            if (typeof src !== "string" || !src.startsWith("https://")) return null;
            // eslint-disable-next-line @next/next/no-img-element
            return <img src={src} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
