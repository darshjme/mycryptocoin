"use client";

interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ParamTableProps {
  params: Param[];
  title?: string;
}

export default function ParamTable({ params, title }: ParamTableProps) {
  return (
    <div className="my-4 rounded-lg border border-dark-700/50 overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-dark-700/50 bg-dark-800/30">
          <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      <table className="param-table">
        <thead>
          <tr className="bg-dark-800/20">
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="hover:bg-dark-800/20 transition-colors">
              <td>
                <code className="text-accent-300">{p.name}</code>
              </td>
              <td>
                <span className="text-dark-300 font-mono text-xs">{p.type}</span>
              </td>
              <td>
                <span
                  className={`param-required ${
                    p.required ? "param-required-yes" : "param-required-no"
                  }`}
                >
                  {p.required ? "Required" : "Optional"}
                </span>
              </td>
              <td className="text-dark-300 text-sm">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
