import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader, Card, Btn } from "../components/ui";

export default function ReminderSettingsScreen() {
  const { settings, updateSettings, navigate, goBack, isOnline } = useApp();

  const [remind3Days, setRemind3Days] = useState(settings.reminderDays.includes(3));
  const [remind1Day, setRemind1Day] = useState(settings.reminderDays.includes(1));
  const [inactiveMonths, setInactiveMonths] = useState(settings.inactiveAfterMonths || 2);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!isOnline) {
      setServerError("No internet connection.");
      return;
    }

    setIsSaving(true);
    setServerError(null);

    const days: number[] = [];
    if (remind3Days) days.push(3);
    if (remind1Day) days.push(1);

    try {
      await updateSettings({
        name: settings.name,
        phone: settings.phone,
        address: settings.address,
        reminderDays: days,
        inactiveAfterMonths: inactiveMonths,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setServerError(err.message || "Failed to save reminder settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader title="Reminder Settings" onBack={goBack} />

      <div className="px-4 py-4 space-y-5">
        {/* Info banner */}
        <div className="bg-blue-dim border border-blue/20 rounded-2xl p-4">
          <p className="text-blue text-xs font-semibold mb-1">ℹ Admin Only Configuration</p>
          <p className="text-text2 text-sm leading-relaxed">
            These rules control automated background notification triggers for membership expiry and consecutive unpaid
            inactivation in SQL Server.
          </p>
        </div>

        {serverError && (
          <div className="bg-red-dim border border-red/20 rounded-xl p-3 text-red text-sm">
            {serverError}
          </div>
        )}

        {/* Membership Expiry */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            Membership Expiry Reminders
          </p>
          <div className="space-y-4">
            <ToggleRow
              label="3 Days Before Expiry"
              desc="Alert Admin when a membership expires in 3 days"
              checked={remind3Days}
              onChange={setRemind3Days}
            />
            <div className="border-t border-border pt-4">
              <ToggleRow
                label="1 Day Before Expiry"
                desc="Alert Admin the day before a membership expires"
                checked={remind1Day}
                onChange={setRemind1Day}
              />
            </div>
          </div>
        </Card>

        {/* Inactive Rule */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">
            2-Month Unpaid / Inactivity Rule
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-text text-sm font-semibold mb-1">Inactivity Threshold</p>
              <p className="text-muted text-xs mb-3">
                Flag member as Inactive after consecutive unpaid months
              </p>
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInactiveMonths(n)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                      inactiveMonths === n
                        ? "bg-primary text-white border-primary"
                        : "bg-card2 text-text2 border-border2"
                    }`}
                  >
                    {n} Month{n > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual rule */}
            <div className="bg-card2 border border-border2 rounded-xl p-3">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">Rule Flow</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-green-dim text-green px-2 py-1 rounded-full font-semibold">
                  Month 1 Paid ✓
                </span>
                <span className="text-muted">→</span>
                <span className="text-[10px] bg-amber-dim text-amber px-2 py-1 rounded-full font-semibold">
                  Month 2 Unpaid ⚠
                </span>
                {inactiveMonths >= 2 && (
                  <>
                    <span className="text-muted">→</span>
                    <span className="text-[10px] bg-red-dim text-red px-2 py-1 rounded-full font-semibold">
                      Month 3 Unpaid 🚨
                    </span>
                  </>
                )}
                <span className="text-muted">→</span>
                <span className="text-[10px] bg-border2 text-muted px-2 py-1 rounded-full font-semibold">
                  Auto-Inactivate
                </span>
              </div>
              <p className="text-muted text-[10px] mt-2 leading-relaxed">
                After <strong className="text-text">{inactiveMonths} consecutive unpaid month{inactiveMonths > 1 ? "s" : ""}</strong>,
                member is automatically transitioned to Inactive without deleting their historical records.
              </p>
            </div>
          </div>
        </Card>

        {saved && (
          <div className="bg-green-dim border border-green/20 rounded-xl px-4 py-3">
            <p className="text-green text-sm font-semibold">✓ Settings saved to SQL Server successfully</p>
          </div>
        )}

        <Btn size="lg" fullWidth onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving to SQL Server..." : "Save Reminder Settings"}
        </Btn>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-text text-sm font-semibold">{label}</p>
        <p className="text-muted text-xs mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
          checked ? "bg-primary" : "bg-border2"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            checked ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
