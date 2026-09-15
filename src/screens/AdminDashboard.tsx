import { useApp } from "../context/AppContext";
import { Card } from "../components/ui";
import Avatar from "../components/Avatar";
import { MemberStatusBadge } from "../components/StatusBadge";
import type { Member } from "../types";

function daysUntil(dateStr?: string) {
  if (!dateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboard() {
  const { currentUser, members, navigate, unreadCount, refreshData, isLoading, isOnline } = useApp();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const total = members.filter((m) => m.memberStatus !== "inactive");
  const active = members.filter((m) => m.memberStatus === "active" || m.memberStatus === "expiring");
  const expiring = members.filter((m) => m.memberStatus === "expiring");
  const pending = members.filter((m) => (m.pendingFee ?? (m.totalFee - m.amountPaid)) > 0 && m.memberStatus !== "inactive");
  const twoMonthUnpaid = members.filter((m) => m.unpaidMonths >= 2 && m.memberStatus !== "inactive");

  const stats = [
    { label: "Total Members", value: total.length, color: "text-blue", bg: "bg-blue-dim" },
    { label: "Active Members", value: active.length, color: "text-green", bg: "bg-green-dim" },
    { label: "Expiring Soon", value: expiring.length, color: "text-amber", bg: "bg-amber-dim" },
    { label: "Pending Fees", value: pending.length, color: "text-primary", bg: "bg-primary-dim" },
    { label: "2 Months Unpaid", value: twoMonthUnpaid.length, color: "text-red", bg: "bg-red-dim" },
  ];

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-5 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-muted text-sm">{greeting},</p>
            <h1 className="font-display text-2xl font-bold text-text tracking-wide">
              {currentUser?.name?.split(" ")[0] || "Admin"} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              disabled={isLoading}
              className="w-10 h-10 bg-card2 rounded-full flex items-center justify-center border border-border2 text-text2 active:scale-95 transition-transform"
              title="Refresh Data"
            >
              <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            </button>
            <button
              onClick={() => navigate("notifications")}
              className="relative w-10 h-10 bg-card2 rounded-full flex items-center justify-center border border-border2"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("settings")}
              className="w-10 h-10 bg-card2 rounded-full flex items-center justify-center border border-border2"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-muted text-xs mt-1">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {!isOnline && (
        <div className="mx-4 mb-4 bg-amber-dim/50 border border-amber/30 rounded-xl px-3 py-2 text-amber text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>You are currently offline. Viewing cached data.</span>
        </div>
      )}

      <div className="px-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(0, 4).map((s) => (
            <Card key={s.label} className="!p-4">
              <p className="text-muted text-xs font-medium mb-2">{s.label}</p>
              <p className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
          <Card className="col-span-2 !p-4 border-red/20 bg-red-dim/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red text-xs font-bold uppercase tracking-wider mb-1">
                  ⚠ 2 Months Unpaid
                </p>
                <p className="font-display text-4xl font-bold text-red">{twoMonthUnpaid.length}</p>
                <p className="text-muted text-xs mt-1">Members with 2+ consecutive unpaid months</p>
              </div>
              <button
                onClick={() => navigate("inactive-members")}
                className="text-red text-xs font-semibold border border-red/30 rounded-xl px-3 py-2 hover:bg-red/10 transition-colors"
              >
                Review All →
              </button>
            </div>
          </Card>
        </div>

        {/* Expiring Soon */}
        {expiring.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-text tracking-wide">⏰ Expiring Soon</h2>
              <button onClick={() => navigate("members")} className="text-primary text-xs font-semibold">
                See all
              </button>
            </div>
            <div className="space-y-3">
              {expiring.map((m) => {
                const days = daysUntil(m.expiryDate);
                return (
                  <ExpiringCard
                    key={m.id}
                    member={m}
                    days={days}
                    onView={() => navigate("member-profile", { memberId: m.id })}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Pending Fees */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-text tracking-wide">💰 Pending Payments</h2>
              <button onClick={() => navigate("payments")} className="text-primary text-xs font-semibold">
                See all
              </button>
            </div>
            <div className="space-y-3">
              {pending.slice(0, 4).map((m) => (
                <PendingCard
                  key={m.id}
                  member={m}
                  onView={() => navigate("member-profile", { memberId: m.id })}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2 Months Unpaid */}
        {twoMonthUnpaid.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-red tracking-wide mb-3">
              🚨 2 Months Unpaid Review
            </h2>
            <div className="space-y-3">
              {twoMonthUnpaid.map((m) => (
                <Card key={m.id} className="border-red/20">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text text-sm">{m.name}</p>
                      <p className="text-red text-xs">{m.unpaidMonths} consecutive months unpaid</p>
                      <p className="text-muted text-xs mt-0.5">
                        Joined: {formatDate(m.joinedOn)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-dim text-red px-2 py-0.5 rounded-full">
                        Action Needed
                      </span>
                      <button
                        onClick={() => navigate("member-profile", { memberId: m.id })}
                        className="text-primary text-xs font-semibold"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Floating Add Member Button */}
      <button
        onClick={() => navigate("add-member")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-[0_4px_24px_rgba(249,115,22,0.5)] z-40 active:scale-95 transition-transform"
        title="Add New Member"
      >
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

function ExpiringCard({
  member,
  days,
  onView,
}: {
  member: Member;
  days: number;
  onView: () => void;
}) {
  const urgency = days <= 0 ? "text-red" : days === 1 ? "text-red" : "text-amber";
  const label = days <= 0 ? "Expired" : days === 1 ? "Expires Tomorrow" : `${days} Days Remaining`;
  return (
    <Card onClick={onView}>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} src={member.avatar} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text text-sm truncate">{member.name}</p>
          <p className="text-muted text-xs">{member.memberId}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <MemberStatusBadge status={member.memberStatus} />
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-muted text-xs">Expires</p>
          <p className="text-text2 text-xs font-medium">
            {new Date(member.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </p>
          <p className={`text-xs font-bold mt-1 ${urgency}`}>{label}</p>
        </div>
      </div>
    </Card>
  );
}

function PendingCard({ member, onView }: { member: Member; onView: () => void }) {
  const pending = member.pendingFee ?? Math.max(0, member.totalFee - member.amountPaid);
  return (
    <Card onClick={onView}>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} src={member.avatar} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text text-sm truncate">{member.name}</p>
          <p className="text-muted text-xs">{member.memberId}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-amber text-base">₹{pending.toLocaleString()}</p>
          <p className="text-muted text-xs">Pending Fee</p>
          <p className="text-muted text-[10px] mt-0.5">Exp: {formatDate(member.expiryDate)}</p>
        </div>
      </div>
    </Card>
  );
}
