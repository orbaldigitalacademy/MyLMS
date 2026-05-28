// =========================
// ⚛️ REACT CERTIFICATE PREVIEW PAGE
// =========================

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CertificatePage() {
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get("/api/certificates/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setCerts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-700 p-10">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">
        🎓 My Certificates
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert) => (
          <div
            key={cert.id}
            className="bg-white rounded-2xl shadow-xl p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {cert.course_title}
              </h2>

              <p className="text-gray-500 text-sm">
                Issued: {new Date(cert.issued_at).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={cert.certificate_url}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center hover:bg-blue-700"
              >
                Download
              </a>

              <a
                href={`/verify/${cert.id}`}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-center hover:bg-gray-100"
              >
                Verify
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// =========================
// 🔍 PUBLIC VERIFY PAGE
// =========================

export function VerifyCertificate() {
  const [cert, setCert] = useState(null);

  const id = window.location.pathname.split("/").pop();

  useEffect(() => {
    axios.get(`/api/certificates/verify/${id}`)
      .then(res => setCert(res.data))
      .catch(() => setCert(false));
  }, [id]);

  if (cert === null) return <p>Loading...</p>;
  if (cert === false) return <p>❌ Invalid Certificate</p>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Certificate Verified
        </h1>

        <p><strong>Name:</strong> {cert.user_name}</p>
        <p><strong>Course:</strong> {cert.course_title}</p>
        <p><strong>Issued:</strong> {new Date(cert.issued_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
