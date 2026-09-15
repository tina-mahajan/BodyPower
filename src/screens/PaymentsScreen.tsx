import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, EmptyState, Modal, Btn } from "../components/ui";
import type { Payment, PaymentMethod } from "../types";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type DateFilter = "today" | "week" | "month" | "all";

export default function PaymentsScreen() {
  const { members, recordPayment, navigate, isOnline } = useApp();
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [search, setSearch] = useState("");

  const [recordModal, setRecordModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNotes, setPayNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const allPayments: Array<Payment & { memberName: string; memberId: string; mId: string }> = members
    .flatMap((m) =>
      m.payments.map((p) => ({
        ...p,
        memberName: p.memberName || m.name,
        memberId: p.memberRefId || m.memberId,
        mId: m.id,
      }))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const filterPayment = (p: typeof allPayments[0]) => {
    const pd = new Date(p.date);
    const now = new Date();

    if (dateFilter === "today" && p.date !== todayStr) return false;
    if (dateFilter === "week") {
      const week = new Date();
      week.setDate(week.getDate() - 7);
      if (pd < week) return false;
    }
    if (dateFilter === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (pd < startOfMonth) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return p.memberName.toLowerCase().includes(q) || p.memberId.toLowerCase().includes(q);
    }
    return true;
  };

  const filtered = allPayments.filter(filterPayment);
  const totalCollection = filtered.reduce((s, p) => s + p.amount, 0);
  const todayCollection = allPayments.filter((p) => p.date === todayStr).reduce((s, p) => s + p.amount, 0);
  const pendingTotal = members
    .filter((m) => m.memberStatus !== "inactive")
    .reduce((s, m) => s + (m.pendingFee ?? Math.max(0, m.totalFee - m.amountPaid)), 0);

  const pendingMembers = members.filter(
    (m) => (m.pendingFee ?? (m.totalFee - m.amountPaid)) > 0 && m.memberStatus !== "inactive"
  );

  const filters: { label: string; value: DateFilter }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "All Time", value: "all" },
  ];

  const handleRecordSubmit = async () => {
    if (!selectedMemberId || !payAmount || Number(payAmount) <= 0) return;
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await recordPayment({
        memberId: selectedMemberId,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        notes: payNotes.trim() || undefined,
      });
      setRecordModal(false);
      setPayAmount("");
      setPayNotes("");
      setSelectedMemberId("");
    } catch (err: any) {
      setServerError(err.message || "Failed to save payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur-md">
        <PageHeader
          title="Payments"
          right={
            <button
              onClick={() => {
                setSelectedMemberId(members[0]?.id || "");
                setRecordModal(true);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              + Record
            </button>
          }
        />
      </div>

      <div className="px-4 space-y-5 pt-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="!p-3 text-center">
            <p className="text-muted text-[10px] font-medium mb-1 uppercase tracking-wider">Today</p>
            <p className="font-display text-lg font-bold text-green">₹{todayCollection.toLocaleString()}</p>
          </Card>
          <Card className="!p-3 text-center">
            <p className="text-muted text-[10px] font-medium mb-1 uppercase tracking-wider">Total Pending</p>
            <p className="font-display text-lg font-bold text-amber">₹{pendingTotal.toLocaleString()}</p>
          </Card>
          <Card className="!p-3 text-center">
            <p className="text-muted text-[10px] font-medium mb-1 uppercase tracking-wider">This Month</p>
            <p className="font-display text-lg font-bold text-blue">₹{totalCollection.toLocaleString()}</p>
          </Card>
        </div>

        {/* Pending Members List */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            Pending Fee Balances ({pendingMembers.length})
          </p>
          {pendingMembers.length === 0 ? (
            <Card>
              <p className="text-muted text-sm text-center py-2">No pending payments 🎉</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingMembers.map((m) => {
                const pend = m.pendingFee ?? Math.max(0, m.totalFee - m.amountPaid);
                return (
                  <button
                    key={m.id}
                    onClick={() => navigate("member-profile", { memberId: m.id })}
                    className="w-full flex items-center justify-between bg-card border border-amber/20 rounded-xl px-4 py-3 text-left hover:border-amber/40 transition-colors"
                  >
                    <div>
                      <p className="text-text text-sm font-semibold">{m.name}</p>
                      <p className="text-muted text-xs">
                        {m.memberId} · {m.mobile}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber font-bold">₹{pend.toLocaleString()}</p>
                      <p className="text-muted text-[10px]">Due Balance</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">
            Payment History ({filtered.length})
          </p>

          {/* Date Filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setDateFilter(f.value)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  dateFilter === f.value
                    ? "bg-primary text-white"
                    : "bg-card2 text-text2 border border-border2 hover:border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="14"
              height="14"
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
              placeholder="Search by member name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card2 border border-border2 rounded-xl pl-9 pr-4 py-2.5 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="₹" title="No payments found" subtitle="Try adjusting your date range or search" />
          ) : (
            <div className="space-y-2">
              <p className="text-muted text-xs">
                {filtered.length} transactions · Total ₹{filtered.reduce((s, p) => s + p.amount, 0).toLocaleString()}
              </p>
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate("member-profile", { memberId: p.mId })}
                  className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 text-left hover:border-border2 transition-colors"
                >
                  <div>
                    <p className="text-text text-sm font-semibold">{p.memberName}</p>
                    <p className="text-muted text-xs">
                      {p.memberId} · {p.method.toUpperCase()}
                      {p.notes ? ` · ${p.notes}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green font-bold">₹{p.amount.toLocaleString()}</p>
                    <p className="text-muted text-xs">{formatDate(p.date)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal open={recordModal} onClose={() => setRecordModal(false)} title="Record Member Payment">
        <div className="space-y-4">
          {serverError && (
            <div className="bg-red-dim border border-red/20 rounded-xl p-3 text-red text-xs">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Select Member</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:border-primary/60 w-full"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.memberId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(["cash", "upi", "card", "other"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayMethod(m)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    payMethod === m
                      ? "bg-primary text-white border-primary"
                      : "bg-card2 text-text2 border-border2"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Monthly fee installment"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <Btn
            fullWidth
            onClick={handleRecordSubmit}
            disabled={!selectedMemberId || !payAmount || Number(payAmount) <= 0 || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Payment"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
