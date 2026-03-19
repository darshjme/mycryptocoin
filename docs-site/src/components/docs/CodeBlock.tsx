"use client";

import { useState, useEffect, useRef } from "react";

interface CodeTab {
  label: string;
  language: string;
  code: string;
}

interface CodeBlockProps {
  tabs?: CodeTab[];
  code?: string;
  language?: string;
  title?: string;
}

function highlightSyntax(code: string, language: string): string {
  // Simple syntax highlighter — handles the common patterns
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Comments
  html = html.replace(
    /(\/\/.*$)/gm,
    '<span class="token comment">$1</span>'
  );
  html = html.replace(
    /(#.*$)/gm,
    '<span class="token comment">$1</span>'
  );
  // Block comments
  html = html.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    '<span class="token comment">$1</span>'
  );

  // Strings (double and single)
  html = html.replace(
    /("(?:[^"\\]|\\.)*")/g,
    '<span class="token string">$1</span>'
  );
  html = html.replace(
    /('(?:[^'\\]|\\.)*')/g,
    '<span class="token string">$1</span>'
  );
  // Template literals
  html = html.replace(
    /(`(?:[^`\\]|\\.)*`)/g,
    '<span class="token string">$1</span>'
  );

  // Keywords
  const keywords =
    language === "python"
      ? "\\b(def|class|import|from|return|if|elif|else|for|while|try|except|raise|with|as|in|not|and|or|True|False|None|async|await|self|print|lambda)\\b"
      : language === "php"
        ? "\\b(function|class|public|private|protected|static|new|return|if|else|elseif|switch|case|break|foreach|for|while|try|catch|throw|require|require_once|include|echo|null|true|false|array|use|namespace)\\b"
        : language === "ruby"
          ? "\\b(def|end|class|module|require|include|if|else|elsif|unless|while|do|begin|rescue|raise|return|true|false|nil|self|puts|attr_accessor)\\b"
          : language === "go"
            ? "\\b(func|package|import|return|if|else|for|range|var|const|type|struct|interface|map|make|nil|true|false|defer|go|chan|select|switch|case|default|break|continue|fmt|err|error)\\b"
            : "\\b(const|let|var|function|return|if|else|switch|case|break|default|for|while|try|catch|throw|new|async|await|class|import|export|from|require|module|true|false|null|undefined|this|typeof|instanceof)\\b";

  html = html.replace(
    new RegExp(keywords, "g"),
    '<span class="token keyword">$1</span>'
  );

  // Numbers
  html = html.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="token number">$1</span>'
  );

  // Function calls
  html = html.replace(
    /\b([a-zA-Z_]\w*)\s*\(/g,
    '<span class="token function">$1</span>('
  );

  // curl specific
  if (language === "bash" || language === "curl") {
    html = html.replace(
      /\b(curl)\b/g,
      '<span class="token function">$1</span>'
    );
    html = html.replace(
      /(-[A-Za-z]+)/g,
      '<span class="token keyword">$1</span>'
    );
  }

  return html;
}

export default function CodeBlock({ tabs, code, language = "bash", title }: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentCode = tabs ? tabs[activeTab].code : code || "";
  const currentLang = tabs ? tabs[activeTab].language : language;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block my-4">
      {/* Tab bar or title bar */}
      <div className="flex items-center justify-between border-b border-[#1e1e3a] bg-[#0a0a14] px-4">
        <div className="flex items-center gap-0">
          {tabs ? (
            tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`tab-button ${i === activeTab ? "tab-button-active" : ""}`}
              >
                {tab.label}
              </button>
            ))
          ) : title ? (
            <span className="py-2 text-xs font-medium text-dark-400">{title}</span>
          ) : (
            <span className="py-2 text-xs font-medium text-dark-400">{currentLang}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-dark-400 hover:text-dark-200 transition-colors rounded"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code
          dangerouslySetInnerHTML={{
            __html: highlightSyntax(currentCode, currentLang),
          }}
        />
      </pre>
    </div>
  );
}
