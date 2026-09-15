import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, EmptyState, Btn } from "../components/ui";
import type { Notification } from "../types";

type NFilter = "all" | "expiry" | "payment" | "unpaid" | "inactive";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TYPE_CONFIG = {
  expiry: { icon: "⏰", label: "Membership Expiry", color: "text-amber", bg: "bg-amber-dim border-amber/20" },
  payment: { icon: "💰", label: "Pending Payment", color: "text-blue", bg: "bg-blue-dim border-blue/20" },
  unpaid: { icon: "🚨", label: "2-Month Unpaid", color: "text-red", bg: "bg-red-dim border-red/20" },
  inactive: { icon: "💤", label: "Moved to Inactive", color: "text-muted", bg: "bg-card2 border-border2" },
  system: { icon: "ℹ️", label: "System Alert", color: "text-text2", bg: "bg-card2 border-border2" },
};

export default function NotificationsScreen() {
  const { notifications, markNotifRead, markAllRead, triggerReminders, navigate, isOnline } = useApp();
  const [filter, setFilter] = useState<NFilter>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  const filters: { label: string; value: NFilter }[] = [
    { label: "All", value: "all" },
    { label: "Expiry", value: "expiry" },
    { label: "Payments", value: "payment" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Inactive", value: "inactive" },
  ];

  const filtered = notifications.filter((n) => filter === "all" || n.type === filter);
  const unread = filtered.filter((n) => !n.read).length;

  const handleRunReminders = async () => {
    if (!isOnline) {
      setReminderResult("Cannot run reminders offline.");
      return;
    }
    setIsProcessing(true);
    setReminderResult(null);
    try {
      const count = await triggerReminders();
      setReminderResult(`Reminders checked. ${count} new notification(s) generated.`);
    } catch (err: any) {
      setReminderResult(err.message || "Failed to process reminders.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md">
        <PageHeader
          title="Notifications"
          right={
            unread > 0 ? (
              <button
                onClick={markAllRead}
                className="text-primary text-xs font-semibold hover:underline"
              >
                Mark all read
              </button>
            ) : undefined
          }
        />

        {/* Filter Pills */}
        <div className="flex gap-2 px-4 pb-3 pt-2 overflow-x-auto hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
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

      <div className="px-4 space-y-4 pt-2">
        {/* Reminder Engine Trigger Card */}
        <div className="bg-card2 border border-border2 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-text text-sm font-semibold">Reminder Engine</p>
            <p className="text-muted text-xs">Evaluates 3-day, 1-day, expiry & 2-month unpaid rules</p>
          </div>
          <button
            onClick={handleRunReminders}
            disabled={isProcessing}
            className="text-xs font-semibold bg-primary text-white px-3 py-2 rounded-xl active:scale-95 transition-transform"
          >
            {isProcessing ? "Running..." : "Run Check"}
          </button>
        </div>

        {reminderResult && (
          <div className="bg-blue-dim border border-blue/20 rounded-xl px-4 py-2.5 text-blue text-xs flex justify-between items-center">
            <span>{reminderResult}</span>
            <button onClick={() => setReminderResult(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" subtitle="You're completely up to date!" />
        ) : (
          <div className="space-y-3">
            {unread > 0 && (
              <p className="text-muted text-xs font-medium">
                {unread} unread alert{unread !== 1 ? "s" : ""}
              </p>
            )}
            {filtered.map((n) => (
              <NotifCard
                key={n.id}
                notif={n}
                onRead={() => markNotifRead(n.id)}
                onView={
                  n.memberId
                    ? () => navigate("member-profile", { memberId: n.memberId! })
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotifCard({
  notif,
  onRead,
  onView,
}: {
  notif: Notification;
  onRead: () => void;
  onView?: () => void;
}) {
  const cfg = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.system;
  return (
    <div
      className={`border rounded-2xl p-4 transition-all ${
        notif.read ? "bg-card border-border opacity-70" : `${cfg.bg} border shadow-sm`
      }`}
      onClick={() => {
        if (!notif.read) onRead();
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            notif.read ? "bg-card2" : cfg.bg
          }`}
        >
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
            {!notif.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
            <span className="text-muted text-[10px] ml-auto">{formatDate(notif.date)}</span>
          </div>
          <p className="text-text text-sm leading-relaxed">{notif.message}</p>
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!notif.read) onRead();
                onView();
              }}
              className="text-primary text-xs font-semibold mt-2 hover:underline inline-block"
            >
              View Member Profile →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
