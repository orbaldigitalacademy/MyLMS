import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Link2,
  Loader2,
  LogOut,
  Lock,
  Mail,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

import { settingsAPI } from "@/services/api";
import api from "@/services/api";

/* -------------------------------------------------------------------------- */
/* Constants + helpers                                                        */
/* -------------------------------------------------------------------------- */

const EMPTY_BANK = {
  bank_name: "",
  account_number: "",
  account_name: "",
  currency: "",
  ifsc_swift: "",
  branch: "",
  is_default: false,
};

const EMPTY_LINK = {
  label: "",
  url: "",
  is_test: false,
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

const isValidUrl = (value) => {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const errorMessage = (err, fallback = "Something went wrong") => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return err?.message || fallback;
};

const maskAccount = (num = "") => {
  const s = String(num);
  if (s.length <= 4) return s;
  return `${"•".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
};

/* -------------------------------------------------------------------------- */
/* Shared UI atoms                                                            */
/* -------------------------------------------------------------------------- */

const SectionHeading = ({ icon: Icon, title, description, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex flex-shrink-0 gap-2">{actions}</div> : null}
  </div>
);

const EmptyState = ({ icon: Icon, title, description, action, testId }) => (
  <div
    data-testid={testId}
    className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center"
  >
    <div className="rounded-full bg-background p-3 shadow-sm">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-base font-medium">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);

const RowSkeleton = () => (
  <div className="flex items-center justify-between rounded-xl border bg-card p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

const CardSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <RowSkeleton key={i} />
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Admin Email                                                                */
/* -------------------------------------------------------------------------- */

const AdminEmailCard = ({ email, loading, onSave }) => {
  const [value, setValue] = useState(email || "");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setValue(email || "");
    setTouched(false);
  }, [email]);

  const dirty = value.trim() !== (email || "").trim();
  const invalid = touched && value.trim() !== "" && !isValidEmail(value);

  const handleSave = async () => {
    if (!isValidEmail(value)) {
      setTouched(true);
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setSaving(true);
      await onSave(value.trim());
      toast.success("Admin email updated");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to update admin email"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card data-testid="admin-email-card" className="overflow-hidden">
      <CardHeader className="gap-1 pb-3">
        <SectionHeading
          icon={Mail}
          title="Admin Email"
          description="Notifications for payments, contacts, and system alerts are delivered here."
        />
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="admin-email-input" className="text-sm">
                Notification email
              </Label>
              <Input
                id="admin-email-input"
                data-testid="admin-email-input"
                type="email"
                placeholder="admin@yourdomain.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={invalid || undefined}
                className={invalid ? "border-destructive" : ""}
              />
              {invalid ? (
                <p className="text-xs text-destructive">
                  Please enter a valid email address.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Used for all outbound admin notifications.
                </p>
              )}
            </div>
            <Button
              data-testid="admin-email-save-btn"
              onClick={handleSave}
              disabled={saving || !dirty || (touched && !isValidEmail(value))}
              className="sm:min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/* Bank dialogs                                                               */
/* -------------------------------------------------------------------------- */

const BankFormFields = ({ values, onChange, errors }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="bank_name">Bank name *</Label>
      <Input
        id="bank_name"
        data-testid="bank-form-bank-name"
        value={values.bank_name}
        onChange={(e) => onChange("bank_name", e.target.value)}
        placeholder="e.g. HDFC Bank"
        aria-invalid={!!errors.bank_name || undefined}
      />
      {errors.bank_name ? (
        <p className="text-xs text-destructive">{errors.bank_name}</p>
      ) : null}
    </div>
    <div className="space-y-2">
      <Label htmlFor="account_name">Account holder *</Label>
      <Input
        id="account_name"
        data-testid="bank-form-account-name"
        value={values.account_name}
        onChange={(e) => onChange("account_name", e.target.value)}
        placeholder="Full name on account"
        aria-invalid={!!errors.account_name || undefined}
      />
      {errors.account_name ? (
        <p className="text-xs text-destructive">{errors.account_name}</p>
      ) : null}
    </div>
    <div className="space-y-2">
      <Label htmlFor="account_number">Account number *</Label>
      <Input
        id="account_number"
        data-testid="bank-form-account-number"
        value={values.account_number}
        onChange={(e) => onChange("account_number", e.target.value)}
        placeholder="0000 0000 0000"
        aria-invalid={!!errors.account_number || undefined}
      />
      {errors.account_number ? (
        <p className="text-xs text-destructive">{errors.account_number}</p>
      ) : null}
    </div>
    <div className="space-y-2">
      <Label htmlFor="ifsc_swift">IFSC / SWIFT</Label>
      <Input
        id="ifsc_swift"
        data-testid="bank-form-ifsc"
        value={values.ifsc_swift}
        onChange={(e) => onChange("ifsc_swift", e.target.value)}
        placeholder="e.g. HDFC0001234"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="currency">Currency</Label>
      <Input
        id="currency"
        data-testid="bank-form-currency"
        value={values.currency}
        onChange={(e) => onChange("currency", e.target.value.toUpperCase())}
        placeholder="INR, USD, EUR…"
        maxLength={8}
      />
    </div>
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="branch">Branch</Label>
      <Input
        id="branch"
        data-testid="bank-form-branch"
        value={values.branch}
        onChange={(e) => onChange("branch", e.target.value)}
        placeholder="Branch name / city"
      />
    </div>
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 sm:col-span-2">
      <div>
        <p className="text-sm font-medium">Set as default</p>
        <p className="text-xs text-muted-foreground">
          Default bank is shown first to customers.
        </p>
      </div>
      <Switch
        data-testid="bank-form-default-switch"
        checked={!!values.is_default}
        onCheckedChange={(v) => onChange("is_default", v)}
      />
    </div>
  </div>
);

const validateBank = (values) => {
  const errors = {};
  if (!values.bank_name.trim()) errors.bank_name = "Bank name is required";
  if (!values.account_name.trim())
    errors.account_name = "Account holder is required";
  if (!values.account_number.trim())
    errors.account_number = "Account number is required";
  return errors;
};

const BankDialog = ({
  open,
  onOpenChange,
  mode = "add",
  initial,
  onSubmit,
}) => {
  const [values, setValues] = useState(EMPTY_BANK);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ? { ...EMPTY_BANK, ...initial } : EMPTY_BANK);
      setErrors({});
    }
  }, [open, initial]);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateBank(values);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save bank account"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={mode === "add" ? "add-bank-dialog" : "edit-bank-dialog"}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {mode === "add" ? "Add bank account" : "Edit bank account"}
          </DialogTitle>
          <DialogDescription>
            These details are shown to customers as manual payment options.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <BankFormFields
            values={values}
            onChange={handleChange}
            errors={errors}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            data-testid="bank-dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="bank-dialog-submit"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : mode === "add" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add bank
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* Bank list                                                                  */
/* -------------------------------------------------------------------------- */

const BankRow = ({ bank, onEdit, onDelete, onMakeDefault, defaulting }) => (
  <div
    data-testid={`bank-row-${bank.id}`}
    className="group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
  >
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
        <Landmark className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{bank.bank_name}</span>
          {bank.currency ? (
            <Badge variant="secondary" className="text-[10px]">
              {bank.currency}
            </Badge>
          ) : null}
          {bank.is_default ? (
            <Badge
              data-testid={`bank-default-badge-${bank.id}`}
              className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <Star className="h-3 w-3 fill-current" />
              Default
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {bank.account_name} · {maskAccount(bank.account_number)}
        </p>
        {(bank.ifsc_swift || bank.branch) && (
          <p className="text-xs text-muted-foreground">
            {[bank.ifsc_swift, bank.branch].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {!bank.is_default ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMakeDefault(bank)}
          disabled={defaulting}
          data-testid={`bank-make-default-${bank.id}`}
        >
          {defaulting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          Set default
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onEdit(bank)}
        data-testid={`bank-edit-${bank.id}`}
      >
        <Edit3 className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDelete(bank)}
        data-testid={`bank-delete-${bank.id}`}
        aria-label={`Delete ${bank.bank_name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const BankAccountsCard = ({
  banks,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onMakeDefault,
}) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [defaultingId, setDefaultingId] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleMakeDefault = async (bank) => {
    try {
      setDefaultingId(bank.id);
      await onMakeDefault(bank);
      toast.success(`${bank.bank_name} set as default`);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to set default"));
    } finally {
      setDefaultingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      setDeletePending(true);
      await onDelete(deleting);
      toast.success("Bank account removed");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete bank"));
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <Card data-testid="bank-accounts-card" className="overflow-hidden">
      <CardHeader className="pb-3">
        <SectionHeading
          icon={Banknote}
          title="Bank Accounts"
          description="Manual bank transfer options offered to your customers."
          actions={
            <Button
              onClick={() => setAddOpen(true)}
              data-testid="add-bank-btn"
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add bank
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <CardSkeleton rows={2} />
        ) : banks.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No bank accounts yet"
            description="Add your first bank account so customers can make manual transfers."
            testId="banks-empty-state"
            action={
              <Button
                onClick={() => setAddOpen(true)}
                data-testid="banks-empty-add-btn"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first bank
              </Button>
            }
          />
        ) : (
          banks.map((b) => (
            <BankRow
              key={b.id}
              bank={b}
              onEdit={setEditing}
              onDelete={setDeleting}
              onMakeDefault={handleMakeDefault}
              defaulting={defaultingId === b.id}
            />
          ))
        )}
      </CardContent>
      {banks.length > 0 ? (
        <CardFooter className="justify-between border-t bg-muted/20 py-3 text-xs text-muted-foreground">
          <span>
            {banks.length} account{banks.length !== 1 ? "s" : ""} configured
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Only admins can edit these details
          </span>
        </CardFooter>
      ) : null}

      <BankDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={async (values) => {
          await onAdd(values);
          toast.success("Bank account added");
        }}
      />
      <BankDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        initial={editing || undefined}
        onSubmit={async (values) => {
          await onUpdate(editing.id, values);
          toast.success("Bank account updated");
        }}
      />
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && !deletePending && setDeleting(null)}
      >
        <AlertDialogContent data-testid="bank-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  You&apos;re about to remove{" "}
                  <span className="font-medium text-foreground">
                    {deleting.bank_name}
                  </span>{" "}
                  ({maskAccount(deleting.account_number)}). This action cannot
                  be undone.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletePending}
              data-testid="bank-delete-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deletePending}
              data-testid="bank-delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/* Payment link dialogs                                                       */
/* -------------------------------------------------------------------------- */

const PaymentLinkFormFields = ({ values, onChange, errors }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="link_label">Label *</Label>
      <Input
        id="link_label"
        data-testid="link-form-label"
        value={values.label}
        onChange={(e) => onChange("label", e.target.value)}
        placeholder="e.g. Stripe Checkout"
        aria-invalid={!!errors.label || undefined}
      />
      {errors.label ? (
        <p className="text-xs text-destructive">{errors.label}</p>
      ) : null}
    </div>
    <div className="space-y-2">
      <Label htmlFor="link_url">URL *</Label>
      <Input
        id="link_url"
        data-testid="link-form-url"
        type="url"
        value={values.url}
        onChange={(e) => onChange("url", e.target.value)}
        placeholder="https://buy.stripe.com/..."
        aria-invalid={!!errors.url || undefined}
      />
      {errors.url ? (
        <p className="text-xs text-destructive">{errors.url}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Must start with http:// or https://
        </p>
      )}
    </div>
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <div>
        <p className="text-sm font-medium">Test mode</p>
        <p className="text-xs text-muted-foreground">
          Mark this link as a test / sandbox link.
        </p>
      </div>
      <Switch
        data-testid="link-form-test-switch"
        checked={!!values.is_test}
        onCheckedChange={(v) => onChange("is_test", v)}
      />
    </div>
  </div>
);

const validateLink = (values) => {
  const errors = {};
  if (!values.label.trim()) errors.label = "Label is required";
  if (!values.url.trim()) errors.url = "URL is required";
  else if (!isValidUrl(values.url)) errors.url = "Enter a valid http(s) URL";
  return errors;
};

const PaymentLinkDialog = ({
  open,
  onOpenChange,
  mode = "add",
  initial,
  onSubmit,
}) => {
  const [values, setValues] = useState(EMPTY_LINK);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initial ? { ...EMPTY_LINK, ...initial } : EMPTY_LINK);
      setErrors({});
    }
  }, [open, initial]);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateLink(values);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        label: values.label.trim(),
        url: values.url.trim(),
        is_test: !!values.is_test,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save payment link"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={
          mode === "add" ? "add-payment-link-dialog" : "edit-payment-link-dialog"
        }
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {mode === "add" ? "Add payment link" : "Edit payment link"}
          </DialogTitle>
          <DialogDescription>
            External checkout URLs (Stripe, Razorpay, PayPal, etc.).
          </DialogDescription>
        </DialogHeader>
        <PaymentLinkFormFields
          values={values}
          onChange={handleChange}
          errors={errors}
        />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            data-testid="link-dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="link-dialog-submit"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : mode === "add" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add link
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------------------------------------------------------------- */
/* Payment links card                                                         */
/* -------------------------------------------------------------------------- */

const PaymentLinkRow = ({ link, onEdit, onDelete }) => (
  <div
    data-testid={`link-row-${link.id}`}
    className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
  >
    <div className="flex min-w-0 items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
        <Link2 className="h-5 w-5" />
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{link.label}</span>
          {link.is_test ? (
            <Badge
              data-testid={`link-badge-test-${link.id}`}
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Test
            </Badge>
          ) : (
            <Badge
              data-testid={`link-badge-live-${link.id}`}
              className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              Live
            </Badge>
          )}
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer noopener"
          className="block truncate text-xs text-muted-foreground hover:text-primary hover:underline"
          title={link.url}
        >
          {link.url}
        </a>
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onEdit(link)}
        data-testid={`link-edit-${link.id}`}
      >
        <Edit3 className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDelete(link)}
        data-testid={`link-delete-${link.id}`}
        aria-label={`Delete ${link.label}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

const PaymentLinksCard = ({ links, loading, onAdd, onUpdate, onDelete }) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  const liveCount = useMemo(
    () => links.filter((l) => !l.is_test).length,
    [links]
  );

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      setDeletePending(true);
      await onDelete(deleting);
      toast.success("Payment link removed");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete link"));
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <Card data-testid="payment-links-card" className="overflow-hidden">
      <CardHeader className="pb-3">
        <SectionHeading
          icon={CreditCard}
          title="Payment Links"
          description="External checkout URLs your customers can use instantly."
          actions={
            <Button
              onClick={() => setAddOpen(true)}
              data-testid="add-payment-link-btn"
              size="sm"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add link
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <CardSkeleton rows={2} />
        ) : links.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No payment links yet"
            description="Paste a Stripe, Razorpay, or PayPal checkout URL to accept online payments."
            testId="links-empty-state"
            action={
              <Button
                onClick={() => setAddOpen(true)}
                data-testid="links-empty-add-btn"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first link
              </Button>
            }
          />
        ) : (
          links.map((l) => (
            <PaymentLinkRow
              key={l.id}
              link={l}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))
        )}
      </CardContent>
      {links.length > 0 ? (
        <CardFooter className="justify-between border-t bg-muted/20 py-3 text-xs text-muted-foreground">
          <span>
            {links.length} link{links.length !== 1 ? "s" : ""} configured
          </span>
          <span>
            {liveCount} live · {links.length - liveCount} test
          </span>
        </CardFooter>
      ) : null}

      <PaymentLinkDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onSubmit={async (values) => {
          await onAdd(values);
          toast.success("Payment link added");
        }}
      />
      <PaymentLinkDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        initial={editing || undefined}
        onSubmit={async (values) => {
          await onUpdate(editing.id, values);
          toast.success("Payment link updated");
        }}
      />
      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && !deletePending && setDeleting(null)}
      >
        <AlertDialogContent data-testid="link-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment link?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? (
                <>
                  You&apos;re about to remove{" "}
                  <span className="font-medium text-foreground">
                    {deleting.label}
                  </span>
                  . Customers using this checkout URL will no longer see it.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletePending}
              data-testid="link-delete-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={deletePending}
              data-testid="link-delete-confirm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/* Admin token gate                                                           */
/* -------------------------------------------------------------------------- */

const ADMIN_TOKEN_KEY = "admin_token";

const readAdminToken = () => {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

const writeAdminToken = (value) => {
  try {
    if (value) localStorage.setItem(ADMIN_TOKEN_KEY, value);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const AdminTokenGate = ({ onUnlock }) => {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const token = value.trim();
    if (!token) {
      setErrorMsg("Please enter your admin token.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.post(
        "/settings/auth/verify",
        {},
        { headers: { "X-Admin-Token": token } }
      );
      writeAdminToken(token);
      toast.success("Admin access granted");
      onUnlock();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setErrorMsg("Invalid admin token. Double-check the value in backend/.env.");
      } else if (status === 500) {
        setErrorMsg("ADMIN_TOKEN is not configured on the server.");
      } else {
        setErrorMsg(errorMessage(err, "Failed to verify token"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="admin-token-gate"
      className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-10"
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-3 rounded-2xl bg-primary/10 p-3 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">Admin access required</CardTitle>
          <CardDescription className="mt-1">
            Enter your admin token to manage settings. It&apos;s stored locally
            in your browser and sent with each request.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-token-input">Admin token</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-token-input"
                  data-testid="admin-token-input"
                  type={show ? "text" : "password"}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="pl-9 pr-10"
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  placeholder="Paste your ADMIN_TOKEN value"
                  aria-invalid={!!errorMsg || undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={show ? "Hide token" : "Show token"}
                  data-testid="admin-token-toggle-visibility"
                  tabIndex={-1}
                >
                  {show ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errorMsg ? (
                <p
                  data-testid="admin-token-error"
                  className="text-xs text-destructive"
                >
                  {errorMsg}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Must match the <code className="rounded bg-muted px-1">ADMIN_TOKEN</code>{" "}
                  set in <code className="rounded bg-muted px-1">backend/.env</code>.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={submitting || !value.trim()}
              className="w-full"
              data-testid="admin-token-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Unlock settings
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminSettings() {
  const [authed, setAuthed] = useState(() => !!readAdminToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    banks: [],
    payment_links: [],
    admin_email: "",
  });

  const applySettings = useCallback((data) => {
    setSettings({
      banks: data?.banks || [],
      payment_links: data?.payment_links || [],
      admin_email: data?.admin_email || "",
    });
  }, []);

  const handleUnauthorized = useCallback(() => {
    writeAdminToken("");
    setAuthed(false);
    toast.error("Admin session expired. Please unlock again.");
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { data } = await settingsAPI.getBankDetails();
      applySettings(data);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError(errorMessage(err, "Failed to load settings"));
    } finally {
      setLoading(false);
    }
  }, [applySettings, handleUnauthorized]);

  useEffect(() => {
    if (!authed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [authed, load]);

  const handleSignOut = () => {
    writeAdminToken("");
    setAuthed(false);
    setSettings({ banks: [], payment_links: [], admin_email: "" });
    toast.success("Signed out of admin");
  };

  if (!authed) {
    return <AdminTokenGate onUnlock={() => setAuthed(true)} />;
  }

  /* ----- Admin email ----- */
  const saveAdminEmail = async (email) => {
    const prev = settings.admin_email;
    setSettings((s) => ({ ...s, admin_email: email })); // optimistic
    try {
      const { data } = await api.put("/settings/admin-email", {
        admin_email: email,
      });
      applySettings(data);
    } catch (err) {
      setSettings((s) => ({ ...s, admin_email: prev })); // rollback
      throw err;
    }
  };

  /* ----- Banks ----- */
  const addBank = async (values) => {
    const { data } = await settingsAPI.addBank(values);
    applySettings(data);
  };

  const updateBank = async (id, values) => {
    // optimistic
    const prev = settings.banks;
    setSettings((s) => ({
      ...s,
      banks: s.banks.map((b) =>
        b.id === id ? { ...b, ...values, id } : values.is_default ? { ...b, is_default: false } : b
      ),
    }));
    try {
      const { data } = await settingsAPI.updateBank(id, values);
      applySettings(data);
    } catch (err) {
      setSettings((s) => ({ ...s, banks: prev }));
      throw err;
    }
  };

  const deleteBank = async (bank) => {
    const prev = settings.banks;
    setSettings((s) => ({
      ...s,
      banks: s.banks.filter((b) => b.id !== bank.id),
    }));
    try {
      const { data } = await settingsAPI.deleteBank(bank.id);
      applySettings(data);
    } catch (err) {
      setSettings((s) => ({ ...s, banks: prev }));
      throw err;
    }
  };

  const makeDefaultBank = async (bank) => {
    await updateBank(bank.id, {
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      account_name: bank.account_name,
      currency: bank.currency || "",
      ifsc_swift: bank.ifsc_swift || "",
      branch: bank.branch || "",
      is_default: true,
    });
  };

  /* ----- Payment links ----- */
  const addLink = async (values) => {
    const { data } = await api.post("/settings/payment-links", values);
    applySettings(data);
  };

  const updateLink = async (id, values) => {
    const prev = settings.payment_links;
    setSettings((s) => ({
      ...s,
      payment_links: s.payment_links.map((l) =>
        l.id === id ? { ...l, ...values, id } : l
      ),
    }));
    try {
      const { data } = await api.put(`/settings/payment-links/${id}`, values);
      applySettings(data);
    } catch (err) {
      setSettings((s) => ({ ...s, payment_links: prev }));
      throw err;
    }
  };

  const deleteLink = async (link) => {
    const prev = settings.payment_links;
    setSettings((s) => ({
      ...s,
      payment_links: s.payment_links.filter((l) => l.id !== link.id),
    }));
    try {
      const { data } = await api.delete(`/settings/payment-links/${link.id}`);
      applySettings(data);
    } catch (err) {
      setSettings((s) => ({ ...s, payment_links: prev }));
      throw err;
    }
  };

  /* ----- Render ----- */
  return (
    <div
      data-testid="admin-settings-page"
      className="min-h-screen bg-gradient-to-b from-background to-muted/30"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Settings2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage notifications, bank accounts, and payment links.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="w-fit gap-1.5 border-primary/30 bg-primary/5 text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin only
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSignOut}
              data-testid="admin-signout-btn"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        {error ? (
          <div
            data-testid="settings-error"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoading(true);
                load();
              }}
              data-testid="settings-retry-btn"
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="space-y-6">
          <AdminEmailCard
            email={settings.admin_email}
            loading={loading}
            onSave={saveAdminEmail}
          />

          <Separator className="opacity-60" />

          <BankAccountsCard
            banks={settings.banks}
            loading={loading}
            onAdd={addBank}
            onUpdate={updateBank}
            onDelete={deleteBank}
            onMakeDefault={makeDefaultBank}
          />

          <PaymentLinksCard
            links={settings.payment_links}
            loading={loading}
            onAdd={addLink}
            onUpdate={updateLink}
            onDelete={deleteLink}
          />
        </div>

        <footer className="mt-10 pt-4 text-center text-xs text-muted-foreground">
          Changes are saved instantly and take effect across the app.
        </footer>
      </div>
    </div>
  );
}
