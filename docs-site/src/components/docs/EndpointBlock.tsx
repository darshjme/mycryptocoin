"use client";

interface EndpointBlockProps {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description?: string;
}

export default function EndpointBlock({ method, path, description }: EndpointBlockProps) {
  const methodColors: Record<string, string> = {
    GET: "method-get",
    POST: "method-post",
    PUT: "method-put",
    DELETE: "method-delete",
  };

  return (
    <div className="flex items-center gap-3 my-4 p-4 rounded-lg bg-dark-800/50 border border-dark-700/50">
      <span className={`method-badge ${methodColors[method]}`}>{method}</span>
      <code className="text-sm font-mono text-dark-100">{path}</code>
      {description && (
        <span className="hidden sm:inline text-sm text-dark-400 ml-auto">
          {description}
        </span>
      )}
    </div>
  );
}
