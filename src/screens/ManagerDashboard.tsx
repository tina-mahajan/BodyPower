import { useApp } from "../context/AppContext";
import { Card } from "../components/ui";
import Avatar from "../components/Avatar";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function ManagerDashboard() {
  const { currentUser, members, navigate, refreshData, isLoading, isOnline } = useApp();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const todayStr = new Date().toISOString().split("T")[0];

  const active = members.filter((m) => m.memberStatus === "active" || m.memberStatus === "expiring");
  const total = members.filter((m) => m.memberStatus !== "inactive");
  
  const todayPayments = members
    .flatMap((m) => m.payments)
    .filter((p) => p.date === todayStr);
  const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);
  const todayAdmissions = members.filter((m) => m.joinedOn === todayStr).length;

  return (
    <div className="min-h-screen bg-bg pb-28">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-blue-dim/60 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted text-sm">{greeting},</p>
            <h1 className="font-display text-2xl font-bold text-text tracking-wide">
              {currentUser?.name?.split(" ")[0] || "Manager"} 👋
            </h1>
          </div>
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="w-10 h-10 bg-card2 rounded-full flex items-center justify-center border border-border2 text-text2 active:scale-95 transition-transform"
            title="Refresh Data"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
          </button>
        </div>
        <p className="text-muted text-xs mt-1">{formatDate(new Date())}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-dim border border-blue/20 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 bg-blue rounded-full" />
          <span className="text-blue text-xs font-semibold">Front-Desk Manager</span>
        </div>
      </div>

      {!isOnline && (
        <div className="mx-4 mb-4 bg-amber-dim/50 border border-amber/30 rounded-xl px-3 py-2 text-amber text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>You are currently offline. Viewing cached data.</span>
        </div>
      )}

      <div className="px-4 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <p className="text-muted text-xs font-medium mb-2">Total Members</p>
            <p className="font-display text-4xl font-bold text-blue">{total.length}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-muted text-xs font-medium mb-2">Active Members</p>
            <p className="font-display text-4xl font-bold text-green">{active.length}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-muted text-xs font-medium mb-2">Today's Admissions</p>
            <p className="font-display text-4xl font-bold text-primary">{todayAdmissions}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-muted text-xs font-medium mb-2">Today's Collection</p>
            <p className="font-display text-3xl font-bold text-amber">₹{todayTotal.toLocaleString()}</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "👤+", label: "Add Member", screen: "add-member" as const },
              { icon: "₹", label: "Record Payment", screen: "payments" as const },
              { icon: "🔍", label: "Find Member", screen: "members" as const },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.screen)}
                className="bg-card2 border border-border2 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 active:scale-95 transition-all"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-text2 text-xs font-semibold text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Recent Admissions</p>
            <button onClick={() => navigate("members")} className="text-primary text-xs font-semibold">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {members
              .filter((m) => m.memberStatus !== "inactive")
              .slice(0, 5)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate("member-profile", { memberId: m.id })}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-border2 active:scale-[0.98] transition-all text-left"
                >
                  <Avatar name={m.name} src={m.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-semibold truncate">{m.name}</p>
                    <p className="text-muted text-xs">{m.memberId} · {m.mobile}</p>
                  </div>
                  <svg className="text-muted flex-shrink-0" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("add-member")}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-[0_4px_24px_rgba(249,115,22,0.5)] z-40 active:scale-95 transition-transform"
        title="Add Member"
      >
        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
