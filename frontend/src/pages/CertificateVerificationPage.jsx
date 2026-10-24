import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, ShieldX, Loader2 } from "lucide-react";
import api from "../services/api";

export default function CertificateVerificationPage() {
  const { certificateId } = useParams();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyCertificate() {
      setLoading(true);
      setError("");
      setCertificate(null);

      try {
        const response = await api.get(
          `/certificates/verify/${encodeURIComponent(certificateId)}`
        );

        if (!active) return;

        if (response.data.valid) {
          setCertificate(response.data);
        } else {
          setError("This certificate could not be verified.");
        }
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.status === 404
            ? "Certificate not found."
            : "Unable to verify certificate at this time."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    verifyCertificate();

    return () => {
      active = false;
    };
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="text-center text-2xl font-bold text-blue-900">
          ORBAL DIGITAL ACADEMY
        </h1>

        <p className="mt-2 text-center text-slate-500">
          Certificate Verification Portal
        </p>

        {loading ? (
          <div className="mt-12 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-700" />
            <p>Verifying certificate...</p>
          </div>
        ) : certificate ? (
          <div className="mt-10">

            <div className="flex flex-col items-center text-green-700">
              <BadgeCheck size={55} />
              <h2 className="mt-3 text-xl font-bold">
                Certificate Verified
              </h2>
            </div>

            <div className="mt-8 space-y-4 rounded-xl bg-slate-50 p-6">
              <p>
                <strong>Student:</strong>{" "}
                {certificate.student_name}
              </p>

              <p>
                <strong>Course:</strong>{" "}
                {certificate.course_title}
              </p>

              <p>
                <strong>Certificate ID:</strong>{" "}
                {certificate.certificate_id}
              </p>

              <p>
                <strong>Date Awarded:</strong>{" "}
                {certificate.issued_at
                  ? new Date(certificate.issued_at).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )
                  : "Not available"}
              </p>

              <p>
                <strong>Issued By:</strong>{" "}
                Orbal Digital Academy
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center text-red-700">
            <ShieldX size={55} />

            <h2 className="mt-3 text-xl font-bold">
              Verification Unsuccessful
            </h2>

            <p className="mt-3 text-center">{error}</p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          © Orbal Digital Academy — Certificate Authentication
        </p>
      </div>
    </div>
  );
}
