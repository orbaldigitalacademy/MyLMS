
import React, { useCallback, useEffect, useState } from "react";
import { alumniManagementApi } from "../../services/alumniManagementApi";
import { CalendarDays, ExternalLink, RefreshCw } from "lucide-react";

const TYPES = {
  opportunities: "Career Opportunities",
  events: "Events & Networking",
  announcements: "Announcements",
};

function safeLink(url) {
  if (!url || typeof url !== "string") return null;

  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol)
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

export default function AlumniContentFeed({ kind }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadContent() {
      setLoading(true);
      setError("");
      setItems([]);

      try {
        const result = await alumniManagementApi.feed(kind);

        if (active) {
          setItems(
            Array.isArray(result?.items) ? result.items : []
          );
        }
      } catch (err) {
        if (active) {
          const detail = err.response?.data?.detail;

          setError(
            typeof detail === "string"
              ? detail
              : err.message || "Unable to load alumni updates."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      active = false;
    };
  }, [kind, reloadKey]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">
          {TYPES[kind] || "Alumni Updates"}
        </h2>

        <button
          type="button"
          onClick={retry}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-slate-500">Loading updates...</p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-4 text-red-700"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={retry}
            className="mt-3 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">
          No published items yet.
        </div>
      )}

      {!loading && !error && items.map((item) => {
        const externalUrl = safeLink(item.external_url);
        const startDate = formatDate(item.starts_at);
        const deadline = formatDate(item.deadline);

        return (
          <article
            key={item.id}
            className="rounded-xl bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-blue-950">
              {item.title}
            </h3>

            {(item.organization || item.location) && (
              <p className="mt-2 text-sm text-slate-500">
                {[item.organization, item.location]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <p className="mt-4 whitespace-pre-wrap text-slate-700">
              {item.description}
            </p>

            {kind === "events" && startDate && (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays className="h-4 w-4" />
                Starts: {startDate} (WAT)
              </p>
            )}

            {kind === "opportunities" && deadline && (
              <p className="mt-4 text-sm text-slate-600">
                Application deadline: {deadline} (WAT)
              </p>
            )}

            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-white hover:bg-blue-900"
              >
                Open details
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </article>
        );
      })}
    </section>
  );
}
