import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantMarkdown } from "../src/components/assistant-markdown";

function render(content: string): string {
  return renderToStaticMarkup(<AssistantMarkdown content={content} />);
}

describe("assistant Markdown rendering", () => {
  it("renders CommonMark formatting and GFM tables with nested lists", () => {
    const html = render([
      "# Summary",
      "",
      "**Bold** and *italic* with a [safe link](https://example.com).",
      "",
      "1. First",
      "   - Nested",
      "     1. Deeper",
      "2. Second",
      "",
      "> Quoted text",
      "",
      "| Name | Value |",
      "| --- | --- |",
      "| Answer | 42 |",
      "",
      "Inline `code`.",
    ].join("\n"));

    expect(html).toContain("<h1>Summary</h1>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain('<a href="https://example.com" target="_blank" rel="noopener noreferrer">safe link</a>');
    expect(html).toContain("<ol>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Name</th>");
    expect(html).toContain("<code>code</code>");
  });

  it("highlights fenced code, labels its language, and keeps copy text", () => {
    const html = render("```typescript\nfunction answer() {\n  return 42;\n}\n```");

    expect(html).toContain("markdown-code-block");
    expect(html).toContain(">typescript</span>");
    expect(html).toContain('aria-label="Copy code"');
    expect(html).toContain("hljs");
    expect(html).toContain('<span class="hljs-keyword">function</span>');
    expect(html).toContain('<span class="hljs-number">42</span>');
  });

  it("ignores raw HTML, blocks unsafe links and images, and handles malformed Markdown", () => {
    const html = render([
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert(1)>",
      "[unsafe](javascript:alert%281%29)",
      "![tracking image](https://example.com/pixel.png)",
      "**unfinished emphasis",
      "```unknown-language!\n<still text>",
    ].join("\n\n"));

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("href=\"javascript:");
    expect(html).not.toContain("<img");
    expect(html).toContain("unsafe</span>");
    expect(html).toContain("unfinished emphasis");
    expect(html).toContain("still text");
  });
});
