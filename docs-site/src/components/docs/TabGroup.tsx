"use client";

import { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
}

export default function TabGroup({ tabs }: TabGroupProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="my-4 rounded-lg border border-dark-700/50 overflow-hidden">
      <div className="flex border-b border-dark-700/50 bg-dark-800/30">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`tab-button ${i === active ? "tab-button-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[active].content}</div>
    </div>
  );
}
