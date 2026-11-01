
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Linkedin, Github, Globe } from "lucide-react";
import api from "../services/api";

export default function AlumniDirectoryPage() {
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAlumni() {
      try {
        const response = await api.get("/alumni/public");

        if (active) {
          setAlumni(response.data.items || []);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load the alumni directory.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAlumni();

    return () => {
      active = false;
    };
  }, []);

  const filtered = alumni.filter((person) => {
    const text = [
      person.full_name,
      person.professional_title,
      ...(person.skills || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  const safeUrl = (value) => {
    if (!value) return null;

    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol)
        ? url.href
        : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-950 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            className="text-sm text-blue-200 hover:text-white"
          >
            Orbal Digital Academy
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Alumni Directory
          </h1>

          <p className="mt-2 text-blue-100">
            Connect with graduates of Orbal Digital Academy.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search alumni by name, skills or profession..."
            aria-label="Search alumni"
            className="w-full bg-transparent outline-none"
          />
        </div>

        {loading && (
          <p className="text-slate-600">
            Loading alumni directory...
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />

            <p className="text-slate-600">
              {search
                ? "No alumni match your search."
                : "No public alumni profiles are available yet."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((person) => (
              <article
                key={person.user_id}
                className="rounded-xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-950">
                  {(person.full_name || "A")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <h2 className="text-xl font-semibold text-slate-900">
                  {person.full_name}
                </h2>

                <p className="mt-1 text-sm font-medium text-blue-800">
                  {person.professional_title || "ODA Alumnus"}
                </p>

                {person.bio && (
                  <p className="mt-3 text-sm text-slate-600">
                    {person.bio}
                  </p>
                )}

                {person.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {person.skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex gap-4">
                  {safeUrl(person.linkedin_url) && (
                    <a
                      href={safeUrl(person.linkedin_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn profile"
                      className="text-blue-700"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}

                  {safeUrl(person.github_url) && (
                    <a
                      href={safeUrl(person.github_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub profile"
                      className="text-slate-700"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}

                  {safeUrl(person.portfolio_url) && (
                    <a
                      href={safeUrl(person.portfolio_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Portfolio website"
                      className="text-blue-700"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
