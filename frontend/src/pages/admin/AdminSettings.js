import { useCallback, useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Landmark,
  Link2,
  Plus,
  Mail,
  Loader2,
  LogOut,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

import { api, getAdminToken, verifyAdminToken, clearAdminToken } from "../lib/api";
import { AdminGate } from "../../components/settings/AdminGate";
import { BankCard } from "../../components/settings/BankCard";
import { BankDialog } from "../../components/settings/BankDialog";
import { LinkCard } from "../../components/settings/LinkCard";
import { LinkDialog } from "../../components/settings/LinkDialog";

export default function SettingsPage() {
  const [authState, setAuthState] = useState("checking"); // checking | locked | unlocked
  const [data, setData] = useState({ banks: [], payment_links: [], admin_email: "" });
  const [loading, setLoading] = useState(true);

  const [emailSaving, setEmailSaving] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankEditing, setBankEditing] = useState(null);
  const [bankSaving, setBankSaving] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkEditing, setLinkEditing] = useState(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Drag & drop state
  const dragSrcId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  // ---------- Auth ----------
  useEffect(() => {
    (async () => {
      const t = getAdminToken();
      if (!t) return setAuthState("locked");
      const ok = await verifyAdminToken(t);
      setAuthState(ok ? "unlocked" : "locked");
      if (!ok) clearAdminToken();
    })();
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAdminToken();
    setAuthState("locked");
    toast.error("Session expired. Please sign in again.");
  }, []);

  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401) handleUnauthorized();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [handleUnauthorized]);

  // ---------- Fetch ----------
  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/settings");
      setData(res.data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState === "unlocked") fetchSettings();
  }, [authState, fetchSettings]);

  // ---------- Email ----------
  const saveEmail = async () => {
    setEmailSaving(true);
    try {
      const res = await api.put("/settings/admin-email", {
        admin_email: data.admin_email,
      });
      setData(res.data);
      toast.success("Admin email updated");
    } catch (e) {
      toast.error(
        e?.response?.data?.detail?.[0]?.msg || "Could not save admin email"
      );
    } finally {
      setEmailSaving(false);
    }
  };

  // ---------- Bank ----------
  const openBankNew = () => {
    setBankEditing(null);
    setBankOpen(true);
  };
  const openBankEdit = (b) => {
    setBankEditing(b);
    setBankOpen(true);
  };
  const saveBank = async (form) => {
    if (!form.bank_name || !form.account_number || !form.account_name) {
      toast.error("Please fill all bank fields");
      return;
    }
    setBankSaving(true);
    try {
      const res = bankEditing
        ? await api.put(`/settings/banks/${bankEditing.id}`, form)
        : await api.post("/settings/banks", form);
      setData(res.data);
      setBankOpen(false);
      toast.success(bankEditing ? "Bank updated" : "Bank added");
    } catch {
      toast.error("Could not save bank");
    } finally {
      setBankSaving(false);
    }
  };
  const deleteBank = async (id) => {
    try {
      const res = await api.delete(`/settings/banks/${id}`);
      setData(res.data);
      toast.success("Bank removed");
    } catch {
      toast.error("Could not delete bank");
    }
  };

  // ---------- Drag & drop ----------
  const handleDragStart = (id) => (e) => {
    dragSrcId.current = id;
    setDraggingId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", id);
      } catch {
        /* noop */
      }
    }
  };
  const handleDragEnter = (id) => () => {
    if (dragSrcId.current && id !== dragSrcId.current) setDragOverId(id);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnd = async () => {
    const srcId = dragSrcId.current;
    const overId = dragOverId;
    dragSrcId.current = null;
    setDragOverId(null);
    setDraggingId(null);
    if (!srcId || !overId || srcId === overId) return;

    const banks = [...data.banks];
    const from = banks.findIndex((b) => b.id === srcId);
    const to = banks.findIndex((b) => b.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = banks.splice(from, 1);
    banks.splice(to, 0, moved);

    const prev = data.banks;
    setData({ ...data, banks }); // optimistic

    try {
      const res = await api.put("/settings/banks/reorder", {
        ordered_ids: banks.map((b) => b.id),
      });
      setData(res.data);
    } catch {
      setData({ ...data, banks: prev });
      toast.error("Could not reorder banks");
    }
  };

  // ---------- Link ----------
  const openLinkNew = () => {
    setLinkEditing(null);
    setLinkOpen(true);
  };
  const openLinkEdit = (l) => {
    setLinkEditing(l);
    setLinkOpen(true);
  };
  const saveLink = async (form) => {
    if (!form.label || !form.url) {
      toast.error("Please provide label and URL");
      return;
    }
    setLinkSaving(true);
    try {
      const res = linkEditing
        ? await api.put(`/settings/payment-links/${linkEditing.id}`, form)
        : await api.post("/settings/payment-links", form);
      setData(res.data);
      setLinkOpen(false);
      toast.success(linkEditing ? "Payment link updated" : "Payment link added");
    } catch (e) {
      toast.error(
        e?.response?.data?.detail?.[0]?.msg || "Could not save payment link"
      );
    } finally {
      setLinkSaving(false);
    }
  };
  const deleteLink = async (id) => {
    try {
      const res = await api.delete(`/settings/payment-links/${id}`);
      setData(res.data);
      toast.success("Payment link removed");
    } catch {
      toast.error("Could not delete link");
    }
  };

  const signOut = () => {
    clearAdminToken();
    setAuthState("locked");
    setData({ banks: [], payment_links: [], admin_email: "" });
  };

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-800" />
      </div>
    );
  }
  if (authState === "locked") {
    return <AdminGate onAuthenticated={() => setAuthState("unlocked")} />;
  }

  const banks = data.banks || [];
  const links = data.payment_links || [];

  return (
    <div
      data-testid={SETTINGS.page}
      className="min-h-screen bg-stone-50 text-stone-900"
      style={{ fontFamily: "'Instrument Sans', ui-sans-serif, system-ui" }}
    >
      <Toaster position="top-right" richColors />
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-14">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">
                Admin · Payments
              </p>
              <h1
                data-testid={SETTINGS.heading}
                className="mt-3 text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-stone-900"
                style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", fontWeight: 500 }}
              >
                Payment <em className="italic text-emerald-800">settings</em>
              </h1>
            </div>
            <Button
              data-testid={SETTINGS.adminSignOutBtn}
              variant="outline"
              onClick={signOut}
              className="rounded-full border-stone-300 hover:border-emerald-700 hover:text-emerald-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-stone-600">
            Manage the bank accounts and payment links customers see at checkout.
            Drag to reorder, mark one bank as the default.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:py-14 space-y-14">
        {/* Admin email */}
        <section className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Mail className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.18em]">Notifications</span>
            </div>
            <h2
              className="mt-2 text-2xl tracking-tight text-stone-900"
              style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", fontWeight: 500 }}
            >
              Admin email
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Where payment confirmations are sent.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="admin-email" className="text-xs uppercase tracking-wider text-stone-500">
                Email address
              </Label>
              <Input
                id="admin-email"
                data-testid={SETTINGS.adminEmailInput}
                type="email"
                placeholder="admin@company.com"
                value={data.admin_email}
                onChange={(e) => setData({ ...data, admin_email: e.target.value })}
                className="mt-2 h-11 rounded-none border-0 border-b-2 border-stone-300 bg-transparent px-0 text-base focus-visible:border-emerald-700 focus-visible:ring-0"
                disabled={loading}
              />
            </div>
            <Button
              data-testid={SETTINGS.adminEmailSaveBtn}
              onClick={saveEmail}
              disabled={emailSaving || loading}
              className="h-11 rounded-full bg-stone-900 px-6 text-white hover:bg-emerald-800 transition-colors"
            >
              {emailSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save email
            </Button>
          </div>
        </section>

        <Separator className="bg-stone-200" />

        {/* Banks */}
        <section data-testid={SETTINGS.banksSection}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-800">
                <Landmark className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Direct transfer</span>
              </div>
              <h2
                className="mt-2 text-3xl tracking-tight text-stone-900"
                style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", fontWeight: 500 }}
              >
                Bank accounts
                <span className="ml-3 align-middle text-base text-stone-400">
                  {banks.length}
                </span>
              </h2>
              {banks.length > 1 ? (
                <p className="mt-1 text-xs text-stone-500">
                  Drag by the handle to reorder.
                </p>
              ) : null}
            </div>
            <Button
              data-testid={SETTINGS.addBankBtn}
              onClick={openBankNew}
              className="rounded-full bg-emerald-800 px-5 text-white hover:bg-emerald-900"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add bank
            </Button>
          </div>

          {loading ? (
            <SkeletonList />
          ) : banks.length === 0 ? (
            <EmptyState
              testid={SETTINGS.banksEmpty}
              icon={<Landmark className="h-6 w-6 text-emerald-800" />}
              title="No bank accounts yet"
              desc="Add your first account so customers can send you funds via transfer."
            />
          ) : (
            <div
              className="grid gap-4 sm:grid-cols-2"
              onDragOver={handleDragOver}
            >
              {banks.map((b) => (
                <BankCard
                  key={b.id}
                  bank={b}
                  onEdit={() => openBankEdit(b)}
                  onDelete={() =>
                    setConfirmDelete({
                      kind: "bank",
                      id: b.id,
                      label: b.bank_name,
                    })
                  }
                  draggable={banks.length > 1}
                  onDragStart={handleDragStart(b.id)}
                  onDragEnter={handleDragEnter(b.id)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingId === b.id}
                  isDropTarget={dragOverId === b.id && draggingId !== b.id}
                />
              ))}
            </div>
          )}
        </section>

        <Separator className="bg-stone-200" />

        {/* Payment links */}
        <section data-testid={SETTINGS.linksSection}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-800">
                <Link2 className="h-4 w-4" />
                <span className="text-xs uppercase tracking-[0.18em]">Online checkout</span>
              </div>
              <h2
                className="mt-2 text-3xl tracking-tight text-stone-900"
                style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif", fontWeight: 500 }}
              >
                Payment links
                <span className="ml-3 align-middle text-base text-stone-400">
                  {links.length}
                </span>
              </h2>
            </div>
            <Button
              data-testid={SETTINGS.addLinkBtn}
              onClick={openLinkNew}
              className="rounded-full bg-stone-900 px-5 text-white hover:bg-emerald-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add link
            </Button>
          </div>

          {loading ? (
            <SkeletonList />
          ) : links.length === 0 ? (
            <EmptyState
              testid={SETTINGS.linksEmpty}
              icon={<Link2 className="h-6 w-6 text-emerald-800" />}
              title="No payment links yet"
              desc="Paste a Stripe, PayPal or any hosted checkout URL for one-click payments."
            />
          ) : (
            <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              {links.map((l) => (
                <LinkCard
                  key={l.id}
                  link={l}
                  onEdit={() => openLinkEdit(l)}
                  onDelete={() =>
                    setConfirmDelete({
                      kind: "link",
                      id: l.id,
                      label: l.label,
                    })
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <BankDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        editing={bankEditing}
        onSubmit={saveBank}
        saving={bankSaving}
      />
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        editing={linkEditing}
        onSubmit={saveLink}
        saving={linkSaving}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                if (confirmDelete.kind === "bank") await deleteBank(confirmDelete.id);
                else await deleteLink(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="rounded-full bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-2xl border border-stone-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState({ testid, icon, title, desc }) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-8 py-14 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
        {icon}
      </div>
      <p
        className="mt-4 text-xl text-stone-900"
        style={{ fontFamily: "'Fraunces', ui-serif, Georgia, serif" }}
      >
        {title}
      </p>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{desc}</p>
    </div>
  );
}
