
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserRound,
  Award,
  BriefcaseBusiness,
  Users,
  CalendarDays,
  Menu,
  X,
  GraduationCap,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Save,
} from "lucide-react";

import AlumniProfileForm from "../../components/AlumniProfileForm";
import { alumniApi } from "../../services/alumniApi";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "My Profile", icon: UserRound },
  { id: "certificates", label: "My Certificates", icon: Award },
  { id: "portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { id: "directory", label: "Alumni Directory", icon: Users },
  { id: "careers", label: "Career Opportunities", icon: BriefcaseBusiness },
  { id: "events", label: "Events & Networking", icon: CalendarDays },
];

export default function AlumniDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    alumniApi
      .me()
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const save = async (data) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const updated = await alumniApi.updateMe(data);
      setProfile(updated);
      setNotice("Your alumni profile has been saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectTab = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
    setNotice("");
    setError("");
  };

  const fullName = profile?.full_name || "Graduate";
  const completedCourses = profile?.completed_course_ids || [];

  const portfolioLinks = [
    { label: "GitHub", url: profile?.github_url },
    { label: "LinkedIn", url: profile?.linkedin_url },
    { label: "Portfolio Website", url: profile?.portfolio_url },
  ].filter((item) => {
    if (!item.url) return false;
    try {
      return ["https:", "http:"].includes(
        new URL(item.url).protocol
      );
    } catch {
      return false;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading alumni dashboard...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Unable to load Alumni Dashboard
          </h2>
          <p className="mt-3 text-red-700">
            {error || "Your alumni profile could not be loaded."}
          </p>
          <Link to="/login" className="mt-5 inline-block text-blue-700 underline">
            Return to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-blue-950 px-4 py-4 text-white shadow-md md:px-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-blue-200" />
          <div>
            <h1 className="text-sm font-bold tracking-wide md:text-lg">
              ORBAL DIGITAL ACADEMY
            </h1>
            <p className="text-xs text-blue-200">Alumni Portal</p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 hover:bg-blue-900 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle alumni navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>

        <div className="hidden items-center gap-2 text-sm md:flex">
          <CheckCircle2 className="h-4 w-4 text-green-300" />
          Verified Alumni
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* SIDEBAR */}
        <aside
          className={`${
            mobileOpen ? "block" : "hidden"
          } w-full shrink-0 border-r border-slate-200 bg-white p-4 shadow-sm lg:block lg:min-h-[calc(100vh-72px)] lg:w-64`}
        >
          <div className="mb-6 border-b border-slate-100 pb-5">
            <p className="font-semibold text-slate-900">{fullName}</p>
            <p className="mt-1 text-xs text-green-700">
              Verified ODA Alumnus
            </p>
          </div>

          <nav className="space-y-1" aria-label="Alumni navigation">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                  activeTab === id
                    ? "bg-blue-950 font-semibold text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-8 flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Student Dashboard
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1 p-4 md:p-8">
          {notice && (
            <div role="status" className="mb-5 rounded-lg bg-green-50 p-4 text-green-800">
              {notice}
            </div>
          )}

          {error && (
            <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-blue-950 p-7 text-white">
                <p className="text-sm text-blue-200">
                  Welcome to the ODA Alumni Network
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  Welcome back, {fullName}!
                </h2>
                <p className="mt-3 text-blue-100">
                  Your achievements. Your network. Your next opportunity.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  icon={Award}
                  title="Completed Courses"
                  value={completedCourses.length}
                />
                <StatCard
                  icon={CheckCircle2}
                  title="Alumni Status"
                  value="Verified"
                />
                <StatCard
                  icon={UserRound}
                  title="Professional Profile"
                  value="Active"
                />
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-xl font-bold text-slate-900">
                  Quick Access
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  {NAV_ITEMS.slice(1, 5).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectTab(id)}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Icon className="h-6 w-6 text-blue-800" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <div className="rounded-2xl bg-white p-5 shadow-sm md:p-7">
              <h2 className="mb-2 text-2xl font-bold text-slate-900">
                My Alumni Profile
              </h2>
              <p className="mb-6 text-sm text-slate-600">
                Update your professional information and public profile.
              </p>

              <AlumniProfileForm
                key={profile.user_id}
                profile={profile}
                onSave={save}
                saving={saving}
              />
            </div>
          )}

          {/* CERTIFICATES */}
          {activeTab === "certificates" && (
            <Section title="My Certificates">
              <p className="mb-5 text-slate-600">
                Access your completed courses and certificates through
                the existing LMS.
              </p>

              <p className="mb-5 text-sm text-slate-500">
                Completed courses recorded in your alumni profile:{" "}
                <strong>{completedCourses.length}</strong>
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg bg-blue-950 px-5 py-3 text-white hover:bg-blue-900"
              >
                Open Student Dashboard
              </button>
            </Section>
          )}

          {/* PORTFOLIO */}
          {activeTab === "portfolio" && (
            <Section title="My Professional Portfolio">
              <p className="mb-6 text-slate-600">
                Showcase your work and professional achievements.
              </p>

              {portfolioLinks.length > 0 ? (
                <div className="space-y-3">
                  {portfolioLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-4 text-blue-800 hover:bg-blue-50"
                    >
                      <span>{item.label}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 p-4 text-slate-600">
                  No portfolio links have been added yet.
                </p>
              )}

              <button
                type="button"
                onClick={() => selectTab("profile")}
                className="mt-6 flex items-center gap-2 rounded-lg bg-blue-950 px-5 py-3 text-white hover:bg-blue-900"
              >
                <Save className="h-4 w-4" />
                Edit Profile Links
              </button>
            </Section>
          )}

          {/* DIRECTORY */}
          {activeTab === "directory" && (
            <Section title="Alumni Directory">
              <p className="mb-5 text-slate-600">
                Connect with fellow Orbal Digital Academy graduates
                who have chosen to appear in the public directory.
              </p>

              <Link
                to="/alumni"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-5 py-3 text-white hover:bg-blue-900"
              >
                <Users className="h-5 w-5" />
                Browse Alumni Directory
              </Link>
            </Section>
          )}

          {/* CAREERS */}
          {activeTab === "careers" && (
            <ComingSoon
              title="Career Opportunities"
              description="Job opportunities, internships, freelance projects and career resources will appear here when the careers module is launched."
            />
          )}

          {/* EVENTS */}
          {activeTab === "events" && (
            <ComingSoon
              title="Events & Networking"
              description="Alumni webinars, networking sessions, mentorship events and professional development activities will appear here."
            />
          )}
        </main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <Icon className="mb-4 h-7 w-7 text-blue-800" />
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <h2 className="mb-5 text-2xl font-bold text-slate-900">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ComingSoon({ title, description }) {
  return (
    <Section title={title}>
      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
        <CalendarDays className="mx-auto mb-4 h-10 w-10 text-blue-800" />
        <h3 className="text-lg font-semibold text-blue-950">
          Coming Soon
        </h3>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          {description}
        </p>
      </div>
    </Section>
  );
}
