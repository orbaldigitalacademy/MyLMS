import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Copy,
  CreditCard,
  FileImage,
  FileText,
  Landmark,
  Link2,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Star,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import Navbar from "../components/Navbar";
import CurrencySelector from "../components/CurrencySelector";
import { coursesAPI, settingsAPI, paymentsAPI, uploadAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLocalCurrency } from "../context/CurrencyContext";
import { BASE_CURRENCY, formatLocalPrice } from "../lib/currency";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const errorMessage = (err, fallback = "Something went wrong") => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return err?.message || fallback;
};

const groupBanks = (banks = []) => {
  const list = Array.isArray(banks) ? [...banks] : [];
  list.sort((a, b) => Number(!!b.is_default) - Number(!!a.is_default));
  return list;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

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

const EmptyState = ({ icon: Icon, title, description, testId }) => (
  <div
    data-testid={testId}
    className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-10 text-center"
  >
    <div className="rounded-full bg-background p-3 shadow-sm">
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="mt-4 text-base font-medium">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
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
    <Skeleton className="h-8 w-20 rounded-md" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* Bank row                                                                   */
/* -------------------------------------------------------------------------- */

const CopyButton = ({ value, field, label, bankId, copiedField, onCopy }) => {
  const key = `${bankId}:${field}`;
  const isCopied = copiedField === key;
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onCopy(value, key)}
      data-testid={`bank-copy-${field}-${bankId}`}
      className="h-8 gap-1.5 px-2 text-xs"
      aria-label={`Copy ${label}`}
    >
      {isCopied ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </Button>
  );
};

const BankRow = ({ bank, onCopy, copiedField }) => {
  const copyProps = { bankId: bank.id, copiedField, onCopy };
  return (
    <div
      data-testid={`payment-bank-row-${bank.id}`}
      className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                  data-testid={`payment-bank-default-badge-${bank.id}`}
                  className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                >
                  <Star className="h-3 w-3 fill-current" />
                  Recommended
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {bank.account_name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Account number
            </p>
            <p
              className="truncate font-mono text-sm font-semibold tracking-wide"
              data-testid={`payment-bank-account-number-${bank.id}`}
            >
              {bank.account_number}
            </p>
          </div>
          <CopyButton
            {...copyProps}
            value={bank.account_number}
            field="account_number"
            label="account number"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Account name
            </p>
            <p className="truncate text-sm font-semibold">
              {bank.account_name}
            </p>
          </div>
          <CopyButton
            {...copyProps}
            value={bank.account_name}
            field="account_name"
            label="account name"
          />
        </div>

        {bank.ifsc_swift ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                IFSC / SWIFT
              </p>
              <p className="truncate font-mono text-sm font-semibold">
                {bank.ifsc_swift}
              </p>
            </div>
            <CopyButton
              {...copyProps}
              value={bank.ifsc_swift}
              field="ifsc_swift"
              label="IFSC / SWIFT"
            />
          </div>
        ) : null}

        {bank.branch ? (
          <div className="flex items-center rounded-lg border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Branch
              </p>
              <p className="truncate text-sm font-semibold">{bank.branch}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Payment link row                                                           */
/* -------------------------------------------------------------------------- */

const PaymentLinkRow = ({ link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noreferrer noopener"
    data-testid={`payment-link-row-${link.id}`}
    className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
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
              data-testid={`payment-link-test-badge-${link.id}`}
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Test
            </Badge>
          ) : (
            <Badge
              data-testid={`payment-link-live-badge-${link.id}`}
              className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              Live
            </Badge>
          )}
        </div>
        <p
          className="truncate text-xs text-muted-foreground group-hover:text-primary"
          title={link.url}
        >
          {link.url}
        </p>
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-1.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
      Pay now
      <ArrowUpRight className="h-4 w-4" />
    </div>
  </a>
);

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

const AmountCard = ({ course, loading, fx, fxLoading }) => (
  <Card data-testid="payment-amount-card" className="overflow-hidden">
    <CardHeader className="pb-3">
      <SectionHeading
        icon={ReceiptText}
        title="Order Summary"
        description="Review the amount before making a transfer."
        actions={<CurrencySelector variant="compact" testId="payment-currency-selector" disabled={loading} />}
      />
    </CardHeader>
    <CardContent className="space-y-4">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Course
            </p>
            <p className="mt-1 text-sm font-medium">{course?.title}</p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-primary/80">
                Amount due
              </p>
              {fx?.userCurrency && fx.userCurrency !== BASE_CURRENCY ? (
                <Badge
                  variant="outline"
                  data-testid="payment-currency-badge"
                  className="border-primary/30 bg-background/60 text-[10px] font-medium text-primary"
                >
                  {fx.countryCode ? `${fx.countryCode} \u00b7 ` : ""}
                  {fx.userCurrency}
                </Badge>
              ) : null}
            </div>
            {fxLoading ? (
              <Skeleton className="mt-2 h-10 w-1/2" />
            ) : (
              <p
                className="mt-1 text-3xl font-semibold tracking-tight text-primary sm:text-4xl"
                data-testid="payment-amount-value"
              >
                {formatLocalPrice(course?.price, fx)}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Transfer the exact amount to any bank below, or pay instantly via
              a payment link.
            </p>
          </div>
        </>
      )}
    </CardContent>
  </Card>
);

const BankAccountsCard = ({ banks, loading }) => {
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = useCallback(async (value, key) => {
    try {
      await navigator.clipboard.writeText(String(value ?? ""));
      setCopiedField(key);
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedField((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch {
      toast.error("Copy failed \u2014 select and copy manually");
    }
  }, []);

  const sorted = useMemo(() => groupBanks(banks), [banks]);

  return (
    <Card data-testid="payment-banks-card" className="overflow-hidden">
      <CardHeader className="pb-3">
        <SectionHeading
          icon={Banknote}
          title="Bank Transfer"
          description="Transfer to any of the accounts below and upload your proof."
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No bank accounts configured"
            description="The admin hasn't added any bank accounts yet. Please try a payment link below or contact support."
            testId="payment-banks-empty"
          />
        ) : (
          sorted.map((b) => (
            <BankRow
              key={b.id}
              bank={b}
              onCopy={handleCopy}
              copiedField={copiedField}
            />
          ))
        )}
      </CardContent>
      {sorted.length > 0 ? (
        <CardFooter className="justify-between border-t bg-muted/20 py-3 text-xs text-muted-foreground">
          <span>
            {sorted.length} account{sorted.length !== 1 ? "s" : ""} available
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified within 1 hour
          </span>
        </CardFooter>
      ) : null}
    </Card>
  );
};

const PaymentLinksCard = ({ links, loading }) => {
  if (!loading && (!links || links.length === 0)) return null;

  return (
    <Card data-testid="payment-links-card" className="overflow-hidden">
      <CardHeader className="pb-3">
        <SectionHeading
          icon={CreditCard}
          title="Pay Online"
          description="Instant checkout via secure external providers."
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : (
          links.map((l) => <PaymentLinkRow key={l.id} link={l} />)
        )}
      </CardContent>
    </Card>
  );
};

const UploadProofCard = ({
  course,
  loading,
  uploading,
  proofFile,
  proofType,
  proofUrl,
  dragActive,
  onDrag,
  onDrop,
  onFileSelect,
  onClear,
  onSubmit,
  submitting,
}) => (
  <Card data-testid="payment-upload-card" className="overflow-hidden">
    <CardHeader className="pb-3">
      <SectionHeading
        icon={Upload}
        title="Upload Payment Proof"
        description="Attach a screenshot or receipt of your transfer for verification."
      />
    </CardHeader>
    <CardContent className="space-y-4">
      <label
        htmlFor="payment-proof-input"
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        data-testid="payment-dropzone"
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30",
        ].join(" ")}
      >
        {uploading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium">Uploading your proof…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hang tight, this only takes a moment.
            </p>
          </>
        ) : proofFile ? (
          <>
            <div className="mb-3 rounded-full bg-emerald-500/15 p-3">
              {proofType === "image" ? (
                <FileImage className="h-6 w-6 text-emerald-600" />
              ) : (
                <FileText className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <p
              className="max-w-full truncate text-sm font-semibold"
              data-testid="payment-proof-filename"
            >
              {proofFile.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click to replace file
            </p>
          </>
        ) : (
          <>
            <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">
              Drag &amp; drop or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, GIF or PDF · Max 10MB
            </p>
          </>
        )}
      </label>
      <input
        id="payment-proof-input"
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        className="hidden"
        data-testid="payment-file-input"
      />

      {proofFile && !uploading ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Proof attached
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onClear}
            data-testid="payment-proof-clear"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      ) : null}

      <Separator className="opacity-60" />

      <Button
        onClick={onSubmit}
        disabled={!proofUrl || submitting || loading}
        className="w-full"
        size="lg"
        data-testid="submit-payment-btn"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Submit for verification
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your payment is verified within one hour. We&apos;ll email you once
        approved and unlock <span className="font-medium">{course?.title || "your course"}</span>.
      </p>
    </CardContent>
  </Card>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PaymentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { fx, fxLoading } = useLocalCurrency();

  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState({ banks: [], payment_links: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [proofFile, setProofFile] = useState(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /* ---------- Auth gate ---------- */
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please login to proceed with payment");
      navigate("/login", { state: { from: `/payment/${courseId}` } });
    }
  }, [isAuthenticated, courseId, navigate]);

  /* ---------- Data load ---------- */
  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [courseRes, bankRes] = await Promise.all([
        coursesAPI.getOne(courseId),
        settingsAPI.getBankDetails(),
      ]);
      setCourse(courseRes.data);

      const data = bankRes.data || {};
      const banks = Array.isArray(data.banks)
        ? data.banks
        : data.bank_name
          ? [
              {
                id: "legacy",
                bank_name: data.bank_name,
                account_number: data.account_number,
                account_name: data.account_name,
                currency: data.currency || "",
                ifsc_swift: data.ifsc_swift || "",
                branch: data.branch || "",
                is_default: true,
              },
            ]
          : [];
      setSettings({
        banks,
        payment_links: Array.isArray(data.payment_links)
          ? data.payment_links
          : [],
      });
    } catch (err) {
      setError(errorMessage(err, "Failed to load payment details"));
      if (err?.response?.status === 404) {
        toast.error("Course not found");
        navigate("/courses");
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  /* ---------- Drag & drop ---------- */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  /* ---------- File select + upload ---------- */
  const handleFileSelect = async (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload an image (JPG, PNG, GIF) or PDF file");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setProofFile(file);
    setProofType(file.type.startsWith("image") ? "image" : "pdf");
    setProofUrl("");
    setUploading(true);
    try {
      const response = await uploadAPI.document(file);
      setProofUrl(response.data.url);
      toast.success("Proof uploaded successfully");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to upload file. Please try again."));
      setProofFile(null);
      setProofType("");
    } finally {
      setUploading(false);
    }
  };

  const handleClearProof = () => {
    setProofFile(null);
    setProofType("");
    setProofUrl("");
  };

  /* ---------- Submit ---------- */
  const handleSubmit = () => {
    if (!proofUrl) {
      toast.error("Please upload your payment proof first");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setSubmitting(true);
    try {
      await paymentsAPI.submit({
        course_id: courseId,
        payment_proof_url: proofUrl,
      });
      toast.success("Payment submitted! We'll verify and notify you shortly.");
      setConfirmOpen(false);
      navigate("/dashboard/payments");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to submit payment"));
    } finally {
      setSubmitting(false);
    }
  };

  const banksConfigured = settings.banks.length > 0;
  const linksConfigured = settings.payment_links.length > 0;
  const noPaymentMethods = !loading && !banksConfigured && !linksConfigured;

  /* ---------- Render ---------- */
  return (
    <div
      data-testid="payment-page"
      className="min-h-screen bg-gradient-to-b from-background to-muted/30"
    >
      <Navbar />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <Link
          to={`/courses/${courseId}`}
          data-testid="payment-back-link"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>

        <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Complete your payment
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a payment method and upload your proof to unlock the
                course.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit gap-1.5 border-primary/30 bg-primary/5 text-primary"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure checkout
          </Badge>
        </header>

        {error ? (
          <div
            data-testid="payment-error"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={load}
              data-testid="payment-retry-btn"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {noPaymentMethods ? (
          <div
            data-testid="payment-no-methods"
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">No payment methods available</p>
              <p className="mt-0.5 text-xs">
                The admin hasn&apos;t configured any bank accounts or payment
                links yet. Please contact support to proceed.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <AmountCard
              course={course}
              loading={loading}
              fx={fx}
              fxLoading={fxLoading}
            />
            <BankAccountsCard banks={settings.banks} loading={loading} />
            <PaymentLinksCard
              links={settings.payment_links}
              loading={loading && !banksConfigured}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6">
              <UploadProofCard
                course={course}
                loading={loading}
                uploading={uploading}
                proofFile={proofFile}
                proofType={proofType}
                proofUrl={proofUrl}
                dragActive={dragActive}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                onClear={handleClearProof}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-4 text-center text-xs text-muted-foreground">
          Payments are reviewed manually. You&apos;ll receive an email
          confirmation once approved.
        </footer>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-testid="payment-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Submit payment for verification?</AlertDialogTitle>
            <AlertDialogDescription>
              We&apos;ll match the uploaded proof against{" "}
              <span className="font-medium text-foreground">
                {formatLocalPrice(course?.price, fx)}
              </span>{" "}
              for{" "}
              <span className="font-medium text-foreground">
                {course?.title}
              </span>
              . You&apos;ll be notified within an hour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={submitting}
              data-testid="payment-confirm-cancel"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmSubmit();
              }}
              disabled={submitting}
              data-testid="payment-confirm-submit"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Yes, submit
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
