import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, Btn, Modal } from "../components/ui";
import type { MembershipPlan, PlanDuration } from "../types";

export default function MembershipPlansScreen() {
  const { plans, savePlan, togglePlan, navigate, goBack, isOnline } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);

  const [pName, setPName] = useState("");
  const [pDuration, setPDuration] = useState<PlanDuration>(1);
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setPName("");
    setPDuration(1);
    setPPrice("");
    setPDesc("");
    setServerError(null);
    setShowModal(true);
  };

  const openEdit = (p: MembershipPlan) => {
    setEditing(p);
    setPName(p.name);
    setPDuration(p.duration);
    setPPrice(String(p.price));
    setPDesc(p.description || "");
    setServerError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!pName.trim() || !pPrice) return;
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await savePlan({
        id: editing?.id,
        name: pName.trim(),
        duration: Number(pDuration),
        price: Number(pPrice),
        description: pDesc.trim() || undefined,
      });
      setShowModal(false);
    } catch (err: any) {
      setServerError(err.message || "Failed to save plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (!isOnline) return;
    try {
      await togglePlan(id);
    } catch {
      // ignore
    }
  };

  const DUR_LABEL: Record<number, string> = {
    1: "1 Month",
    3: "3 Months",
    6: "6 Months",
    12: "12 Months",
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Membership Plans"
        onBack={goBack}
        right={
          <button
            onClick={openAdd}
            className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
            title="Add Plan"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        }
      />

      <div className="px-4 py-4 space-y-3">
        {plans.map((p) => (
          <Card key={p.id} className={!p.active ? "opacity-50" : ""}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl font-bold text-text tracking-wide">{p.name}</h3>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      p.active ? "bg-green-dim text-green" : "bg-border2 text-muted"
                    }`}
                  >
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-muted text-xs">
                  {DUR_LABEL[p.duration] || `${p.duration} Months`} Duration
                </p>
                {p.description && <p className="text-text2 text-xs mt-1">{p.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-primary">₹{p.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <button
                onClick={() => openEdit(p)}
                className="flex-1 text-xs font-semibold text-text2 bg-card2 border border-border2 rounded-xl py-2 hover:border-primary/40 transition-colors"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleToggle(p.id)}
                className={`flex-1 text-xs font-semibold rounded-xl py-2 border transition-colors ${
                  p.active
                    ? "text-red bg-red-dim border-red/20 hover:bg-red/20"
                    : "text-green bg-green-dim border-green/20 hover:bg-green/20"
                }`}
              >
                {p.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Plan" : "Add Plan"}>
        <div className="space-y-4">
          {serverError && (
            <div className="bg-red-dim border border-red/20 rounded-xl p-3 text-red text-xs">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Plan Name</label>
            <input
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="e.g. Quarterly"
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Duration (Months)</label>
            <div className="grid grid-cols-4 gap-2">
              {([1, 3, 6, 12] as PlanDuration[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPDuration(d)}
                  className={`py-2 rounded-xl text-xs font-semibold border ${
                    pDuration === d
                      ? "bg-primary text-white border-primary"
                      : "bg-card2 text-text2 border-border2"
                  }`}
                >
                  {d}M
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Price (₹)</label>
            <input
              type="number"
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              placeholder="e.g. 4000"
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text2 uppercase tracking-wider">Description</label>
            <input
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="e.g. Full floor access + locker"
              className="bg-card2 border border-border2 rounded-xl px-4 py-3 text-text placeholder-muted text-sm focus:outline-none focus:border-primary/60 w-full"
            />
          </div>

          <Btn fullWidth onClick={handleSave} disabled={!pName || !pPrice || isSubmitting}>
            {isSubmitting ? "Saving..." : editing ? "Save Changes" : "Create Plan"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
}
