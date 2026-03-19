"use client";

interface InfoBoxProps {
  type: "info" | "warning" | "success" | "danger";
  title?: string;
  children: React.ReactNode;
}

const icons: Record<string, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  danger: (
    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const titles: Record<string, string> = {
  info: "Info",
  warning: "Warning",
  success: "Tip",
  danger: "Danger",
};

export default function InfoBox({ type, title, children }: InfoBoxProps) {
  return (
    <div className={`info-box info-box-${type}`}>
      <div className="flex gap-3">
        {icons[type]}
        <div>
          <p className="font-semibold text-sm mb-1 text-dark-50">
            {title || titles[type]}
          </p>
          <div className="text-sm text-dark-200 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
