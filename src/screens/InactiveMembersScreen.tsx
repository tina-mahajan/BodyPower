import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, EmptyState, SuccessModal } from "../components/ui";
import Avatar from "../components/Avatar";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function InactiveMembersScreen() {
  const { members, reactivateMember, navigate, goBack, isOnline } = useApp();
  const [reactivating, setReactivating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactivateSuccess, setReactivateSuccess] = useState(false);
  const [reactivatedName, setReactivatedName] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const inactive = members.filter((m) => m.memberStatus === "inactive");

  const handleReactivate = async (memberId: string) => {
    const m = members.find((mb) => mb.id === memberId);
    if (!m) return;
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      setReactivatedName(m.name);
      await reactivateMember(memberId);
      setReactivating(null);
      setReactivateSuccess(true);
    } catch (err: any) {
      setServerError(err.message || "Failed to reactivate member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="Inactive Members" onBack={goBack} />

      {serverError && (
        <div className="mx-4 mt-3 bg-red-dim border border-red/20 rounded-xl p-3 text-red text-sm">
          {serverError}
        </div>
      )}

      <div className="px-4 py-4">
        {inactive.length === 0 ? (
          <EmptyState
            icon="💤"
            title="No inactive members"
            subtitle="All members are currently active or expiring"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-muted text-xs font-medium">
              {inactive.length} inactive member{inactive.length !== 1 ? "s" : ""}
            </p>
            {inactive.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} src={m.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-text text-sm truncate">{m.name}</p>
                      <span className="text-[10px] bg-border2 text-muted px-2 py-0.5 rounded-full font-bold uppercase">
                        Inactive
                      </span>
                    </div>
                    <p className="text-muted text-xs">
                      {m.memberId} · {m.mobile}
                    </p>

                    <div className="mt-2.5 space-y-1 bg-card2/50 rounded-xl p-2.5 border border-border2">
                      <div className="flex justify-between">
                        <span className="text-muted text-xs">Last Payment</span>
                        <span className="text-text2 text-xs font-medium">
                          {m.payments.length > 0 ? formatDate(m.payments[0].date) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted text-xs">Unpaid Months</span>
                        <span className="text-red text-xs font-bold">
                          {m.unpaidMonths} Month{m.unpaidMonths !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {m.inactiveSince && (
                        <div className="flex justify-between">
                          <span className="text-muted text-xs">Inactive Since</span>
                          <span className="text-text2 text-xs font-medium">{formatDate(m.inactiveSince)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => navigate("member-profile", { memberId: m.id })}
                    className="flex-1 text-xs font-semibold text-text2 bg-card2 border border-border2 rounded-xl py-2.5 hover:border-primary/40 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setReactivating(m.id)}
                    className="flex-1 text-xs font-semibold text-green bg-green-dim border border-green/20 rounded-xl py-2.5 hover:bg-green/20 transition-colors"
                  >
                    ✓ Reactivate
                  </button>
                </div>

                {reactivating === m.id && (
                  <div className="mt-3 bg-green-dim border border-green/20 rounded-xl p-3">
                    <p className="text-green text-xs font-semibold mb-2">
                      Confirm reactivation of {m.name}? Status will return to active.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReactivating(null)}
                        className="flex-1 text-xs text-muted bg-card2 border border-border2 rounded-xl py-2"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReactivate(m.id)}
                        className="flex-1 text-xs text-white bg-green rounded-xl py-2 font-semibold"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Reactivating..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SuccessModal
        open={reactivateSuccess}
        onClose={() => setReactivateSuccess(false)}
        title="Member Reactivated!"
        message={`${reactivatedName} has been successfully reactivated in BodyPower Gym.`}
      />
    </div>
  );
}
