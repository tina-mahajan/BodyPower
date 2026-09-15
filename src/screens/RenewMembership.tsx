import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Btn, SuccessModal } from "../components/ui";
import Avatar from "../components/Avatar";
import type { PaymentMethod } from "../types";

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function RenewMembership() {
  const { screenParams, members, plans, renewMembership, navigate, goBack, isOnline } = useApp();
  const member = members.find((m) => m.id === screenParams.memberId || m.memberId === screenParams.memberId);

  const todayStr = new Date().toISOString().split("T")[0];

  const [planId, setPlanId] = useState(member?.planId || plans[0]?.id || "p1");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("upi");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!member) return null;

  const selectedPlan = plans.find((p) => p.id === planId) || plans[0];
  const totalFee = selectedPlan?.price || 0;
  const duration = selectedPlan?.duration || 1;

  // Base date for extension: if current expiry is in the future, extend from expiry, else from today
  const baseDate = member.expiryDate > todayStr ? member.expiryDate : todayStr;
  const newExpiry = addMonths(baseDate, duration);
  const paid = Number(amountPaid) || totalFee;

  const handleRenew = async () => {
    if (!isOnline) {
      setServerError("No internet connection. Please reconnect before renewing membership.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await renewMembership(member.id, {
        planId,
        startDate: baseDate,
        amountPaid: paid,
        paymentMethod: payMethod,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message || "Failed to renew membership.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PageHeader
        title="Renew Membership"
        onBack={goBack}
      />

      {!isOnline && (
        <div className="bg-amber-dim/50 border border-amber/30 px-4 py-2 text-amber text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>You are offline. Transactions require internet connectivity.</span>
        </div>
      )}

      {serverError && (
        <div className="mx-4 mt-3 bg-red-dim border border-red/20 rounded-xl p-3 text-red text-sm flex items-center justify-between">
          <span>{serverError}</span>
          <button onClick={() => setServerError(null)} className="text-red font-bold ml-2">✕</button>
        </div>
      )}

      <div className="px-4 py-5 space-y-5">
        {/* Current Status */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Current Member</p>
          <div className="flex items-center gap-3">
            <Avatar name={member.name} src={member.avatar} size="md" />
            <div>
              <p className="font-semibold text-text">{member.name}</p>
              <p className="text-muted text-xs">{member.memberId} · {member.mobile}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm">
            <span className="text-muted">Current Expiry</span>
            <span className="text-text font-semibold">{formatDate(member.expiryDate)}</span>
          </div>
        </div>

        {/* Select Plan */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Select Renewal Plan</p>
          <div className="space-y-2">
            {plans
              .filter((p) => p.active)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPlanId(p.id);
                    setAmountPaid("");
                  }}
                  className={`w-full flex items-center justify-between border rounded-2xl px-4 py-4 transition-all ${
                    planId === p.id ? "border-primary bg-primary/10" : "border-border2 bg-card"
                  }`}
                >
                  <div className="text-left">
                    <p
                      className={`font-semibold text-sm ${
                        planId === p.id ? "text-primary" : "text-text"
                      }`}
                    >
                      {p.name}
                    </p>
                    <p className="text-muted text-xs">
                      {p.duration} Month{p.duration > 1 ? "s" : ""} Access
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-base ${
                        planId === p.id ? "text-primary" : "text-text"
                      }`}
                    >
                      ₹{p.price.toLocaleString()}
                    </p>
                    {planId === p.id && (
                      <span className="text-[10px] text-primary font-semibold">Selected ✓</span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* New Expiry Preview */}
        <div className="bg-green-dim border border-green/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-green font-semibold uppercase tracking-wider">New Expiry Date</p>
            <p className="font-display text-xl font-bold text-text mt-1">{formatDate(newExpiry)}</p>
          </div>
          <div className="text-3xl">📅</div>
        </div>

        {/* Payment */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Payment Details</p>
          <div className="space-y-3">
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted text-sm">Plan Fee</span>
                <span className="text-text font-bold">₹{totalFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Amount Paid</span>
                <span className="text-green font-bold">
                  ₹{(Number(amountPaid) || totalFee).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
                Amount (leave blank for full ₹{totalFee})
              </label>
              <input
                type="number"
                placeholder={`₹${totalFee} (full)`}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["cash", "upi", "card", "other"] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
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
              <label className="text-xs font-semibold text-text2 uppercase tracking-wider">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #99281"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
              />
            </div>
          </div>
        </div>

        <Btn size="lg" fullWidth onClick={handleRenew} disabled={isSubmitting}>
          {isSubmitting ? "Processing Renewal in SQL Server..." : "🔄 Renew Membership"}
        </Btn>
      </div>

      <SuccessModal
        open={success}
        onClose={() => {
          setSuccess(false);
          navigate("member-profile", { memberId: member.id });
        }}
        title="Membership Renewed!"
        message={`${member.name}'s membership has been extended until ${formatDate(newExpiry)}.`}
      />
    </div>
  );
}
