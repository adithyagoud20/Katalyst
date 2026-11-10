"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

type CodeElementProps = {
  className?: string;
  children?: ReactNode;
};

function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFromNode(node.props.children);
  return "";
}

function safeLink(value: string): string | undefined {
  const href = value.trim();
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return undefined;
  if (href.startsWith("#")) return href;

  try {
    const url = new URL(href);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return href;
  } catch {
    return undefined;
  }

  return undefined;
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setFailed(true);
      setCopied(false);
    }
  };

  return <button className="markdown-code-copy" type="button" aria-label={copied ? "Code copied" : failed ? "Copy code failed" : "Copy code"} title={failed ? "Clipboard access is unavailable" : copied ? "Copied" : "Copy code"} onClick={() => void copy()}>
    {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
    <span>{copied ? "Copied" : failed ? "Try again" : "Copy"}</span>
    <span className="visually-hidden" role="status" aria-live="polite">{copied ? "Code copied to clipboard" : failed ? "Could not copy code" : ""}</span>
  </button>;
}

const markdownComponents: Components = {
  a({ href, children }) {
    const destination = href ? safeLink(href) : undefined;
    if (!destination) return <span>{children}</span>;
    return <a href={destination} {...(/^https?:/i.test(destination) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>;
  },
  img() {
    return null;
  },
  code({ className, children }) {
    return <code className={className}>{children}</code>;
  },
  pre({ children }) {
    const codeElement = Children.toArray(children).find((child) => isValidElement<CodeElementProps>(child));
    if (!isValidElement<CodeElementProps>(codeElement)) return <pre>{children}</pre>;

    const { className, children: codeChildren } = codeElement.props;
    const language = className?.match(/(?:^|\s)language-([a-zA-Z0-9_+-]+)/)?.[1];
    const code = textFromNode(codeChildren);

    return <div className="markdown-code-block">
      <div className="markdown-code-heading">
        <span className="markdown-code-language">{language ?? "Code"}</span>
        <CodeCopyButton code={code} />
      </div>
      <div className="markdown-code-scroll"><pre><code className={className}>{codeChildren}</code></pre></div>
    </div>;
  },
  table({ children }) {
    return <div className="markdown-table-scroll"><table>{children}</table></div>;
  },
};

/**
 * Renders one assistant response from its current text value. It holds no parser
 * state, so future streamed partial values can use the same rendering path.
 */
export function AssistantMarkdown({ content }: { content: string }) {
  return <div className="assistant-markdown">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={markdownComponents}
      skipHtml
      urlTransform={(url) => safeLink(url) ?? ""}
    >
      {content}
    </ReactMarkdown>
  </div>;
}
