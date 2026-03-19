"use client";

import { useState, useEffect, useCallback } from "react";

interface SidebarItem {
  id: string;
  label: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const navigation: SidebarGroup[] = [
  {
    title: "GETTING STARTED",
    items: [
      { id: "installation", label: "Installation" },
      { id: "quick-start", label: "Quick Start" },
      { id: "authentication", label: "Authentication" },
      { id: "first-payment", label: "First Payment" },
      { id: "testing", label: "Testing (Test Mode)" },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      { id: "api-keys", label: "API Keys" },
      { id: "webhooks", label: "Webhooks" },
      { id: "supported-cryptos", label: "Supported Cryptos" },
      { id: "auto-convert", label: "Auto-Convert (USDT)" },
      { id: "fee-structure", label: "Fee Structure" },
      { id: "whatsapp-setup", label: "WhatsApp Setup" },
      { id: "email-notifications", label: "Email Notifications" },
    ],
  },
  {
    title: "PAYMENTS",
    items: [
      { id: "create-payment", label: "Create Payment" },
      { id: "payment-status", label: "Payment Status" },
      { id: "payment-lifecycle", label: "Payment Lifecycle" },
      { id: "hosted-checkout", label: "Hosted Checkout Page" },
      { id: "custom-checkout", label: "Custom Checkout" },
    ],
  },
  {
    title: "WALLETS & WITHDRAWALS",
    items: [
      { id: "usdt-balance", label: "USDT Balance" },
      { id: "withdrawal-process", label: "Withdrawal Process" },
      { id: "auto-withdraw", label: "Auto-Withdraw" },
      { id: "transaction-history", label: "Transaction History" },
    ],
  },
  {
    title: "MERCHANT API",
    items: [
      { id: "merchant-profile", label: "Profile" },
      { id: "api-keys-management", label: "API Keys Management" },
      { id: "webhook-management", label: "Webhook Management" },
    ],
  },
  {
    title: "INTEGRATIONS",
    items: [
      { id: "wordpress-woocommerce", label: "WordPress / WooCommerce" },
      { id: "rest-api", label: "REST API" },
      { id: "javascript-sdk", label: "JavaScript SDK" },
      { id: "python-sdk", label: "Python SDK" },
      { id: "php-sdk", label: "PHP SDK" },
      { id: "ruby-sdk", label: "Ruby SDK" },
    ],
  },
  {
    title: "ADMIN",
    items: [
      { id: "admin-dashboard", label: "Dashboard" },
      { id: "merchant-management", label: "Merchant Management" },
      { id: "withdrawal-approvals", label: "Withdrawal Approvals" },
      { id: "fraud-detection", label: "Fraud Detection" },
      { id: "whatsapp-admin", label: "WhatsApp Admin" },
    ],
  },
  {
    title: "SECURITY",
    items: [
      { id: "webhook-signatures", label: "Webhook Signatures" },
      { id: "hmac-verification", label: "HMAC Verification" },
      { id: "2fa-setup", label: "2FA Setup" },
      { id: "ip-whitelisting", label: "IP Whitelisting" },
      { id: "encryption", label: "Encryption" },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [activeSection, setActiveSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // IntersectionObserver for active section tracking
  useEffect(() => {
    const allIds = navigation.flatMap((g) => g.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
    onClose();
  };

  const filteredNav = searchQuery
    ? navigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.id.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((group) => group.items.length > 0)
    : navigation;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-dark-700/50">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/20 transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3">
        {filteredNav.map((group) => {
          const isCollapsed = collapsedGroups.has(group.title);
          return (
            <div key={group.title} className="mb-4">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold tracking-widest text-dark-400 hover:text-dark-200 transition-colors"
              >
                {group.title}
                <svg
                  className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item.id)}
                      className={`sidebar-item w-full text-left px-3 py-1.5 text-[13px] rounded-md ${
                        activeSection === item.id
                          ? "bg-accent-500/10 text-accent-400 font-medium"
                          : "text-dark-300 hover:text-dark-100 hover:bg-dark-700/30"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-[280px] border-r border-dark-700/50 bg-dark-900">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="sidebar-overlay absolute inset-0" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-dark-900 border-r border-dark-700/50 pt-16 z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

export { navigation };
export type { SidebarGroup, SidebarItem };
