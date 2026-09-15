import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, EmptyState } from "../components/ui";
import { MemberStatusBadge, PaymentStatusBadge } from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import type { Member, MemberStatus } from "../types";

type Filter = "all" | MemberStatus;

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MembersScreen() {
  const { members, navigate } = useApp();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Expiring", value: "expiring" },
    { label: "Expired", value: "expired" },
    { label: "Inactive", value: "inactive" },
  ];

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.mobile.includes(q) ||
      m.memberId.toLowerCase().includes(q);
    const matchFilter = filter === "all" || m.memberStatus === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md">
        <PageHeader
          title="Members"
          right={
            <button
              onClick={() => navigate("add-member")}
              className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
              title="Add Member"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          }
        />

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, mobile or Member ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card2 border border-border2 rounded-xl pl-10 pr-9 py-2.5 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
                filter === f.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card2 text-text2 border border-border2 hover:border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-2">
        {filtered.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No members found"
            subtitle={search ? `No results for "${search}"` : "Try selecting a different filter"}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-muted text-xs font-medium">
              Showing {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </p>
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                onClick={() => navigate("member-profile", { memberId: m.id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Member FAB */}
      <button
        onClick={() => navigate("add-member")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-[0_4px_24px_rgba(249,115,22,0.5)] z-40 active:scale-95 transition-transform"
        title="New Admission"
      >
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

function MemberCard({ member, onClick }: { member: Member; onClick: () => void }) {
  const pending = member.pendingFee ?? Math.max(0, member.totalFee - member.amountPaid);
  return (
    <button
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-border2 active:scale-[0.98] transition-all group"
    >
      <div className="flex items-start gap-3">
        <Avatar name={member.name} src={member.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="font-semibold text-text text-sm truncate group-hover:text-primary transition-colors">
              {member.name}
            </p>
            <MemberStatusBadge status={member.memberStatus} />
          </div>
          <p className="text-muted text-xs">
            {member.memberId} · {member.mobile}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-text2 text-[11px] bg-card2 border border-border2 px-2 py-0.5 rounded-full">
              {member.planName || "Monthly Plan"}
            </span>
            <span className="text-muted text-[11px]">Exp: {formatDate(member.expiryDate)}</span>
            {pending > 0 && <PaymentStatusBadge status={member.paymentStatus} pending={pending} />}
          </div>
        </div>
        <svg
          className="text-muted flex-shrink-0 mt-1 group-hover:text-text transition-colors"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}
