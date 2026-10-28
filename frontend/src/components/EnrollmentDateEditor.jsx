import { useState } from "react";
import api from "@/lib/api";

export default function EnrollmentDateEditor({
  enrollment,
  onUpdated,
}) {
  const initialDate =
    enrollment.enrollment_date ||
    enrollment.created_at ||
    "";

  const [date, setDate] = useState(
    initialDate ? initialDate.slice(0, 10) : ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveDate = async () => {
    if (!date) {
      setMessage("Please select an enrollment date.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await api.put(
        `/admin/enrollments/${enrollment.id}/date`,
        {
          enrollment_date: date,
        }
      );

      setMessage("Enrollment date updated successfully.");

      if (onUpdated) {
        await onUpdated();
      }
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
        "Unable to update enrollment date."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Enrollment Date
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={saveDate}
          disabled={saving}
          className="rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Date"}
        </button>
      </div>

      {message && (
        <p className="text-sm text-slate-600">{message}</p>
      )}
    </div>
  );
}
