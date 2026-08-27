import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import CertificateView from "../../components/common/CertificateView";
import { Loader2, Award, ArrowLeft } from "lucide-react";

export default function FounderCertificate() {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState(null);
  const [startup, setStartup] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [certRes, myRes] = await Promise.all([
          apiRequest("/certificates/my").catch(() => null),
          apiRequest("/startups/my").catch(() => null),
        ]);

        const certificate = certRes?.data || null;
        const myStartup = myRes?.data || null;
        setCert(certificate);
        setStartup(myStartup);

        if (!certificate && !myStartup?.certificateNumber) {
          setError("No designation certificate has been issued yet.");
        }
      } catch (err) {
        setError(err.message || "Unable to load certificate");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const application = cert
    ? {
        legalName: cert.startupName || startup?.companyName,
        tradeName: cert.tradeName || startup?.tradeName,
        sector: cert.sector || startup?.sector,
        growthStage: cert.growthStage || startup?.fundingStage,
        tin: startup?.tin || null,
        commercialRegNo:
          startup?.commercialRegNo || startup?.registrationNumber || null,
        headquarters: startup?.location || startup?.headquarters || null,
        status: startup?.status || "designated",
        designatedAt: startup?.designatedAt || startup?.verifiedAt,
        designationExpiresAt: cert.expiresAt || startup?.designationExpiresAt,
        certificateNumber: cert.certificateNumber,
        certificate: cert,
      }
    : startup?.certificateNumber
      ? {
          legalName: startup.companyName,
          tradeName: startup.tradeName,
          sector: startup.sector,
          growthStage: startup.fundingStage,
          tin: startup.tin || null,
          commercialRegNo:
            startup.commercialRegNo || startup.registrationNumber || null,
          headquarters: startup.location || startup.headquarters || null,
          status: startup.status,
          designatedAt: startup.designatedAt || startup.verifiedAt,
          designationExpiresAt: startup.designationExpiresAt,
          certificateNumber: startup.certificateNumber,
          certificate: {
            certificateNumber: startup.certificateNumber,
            issuedAt: startup.designatedAt || startup.verifiedAt,
            expiresAt: startup.designationExpiresAt,
          },
        }
      : null;

  return (
    <AppShell
      title="Designation certificate"
      subtitle="Official record under Proclamation No. 1396/2025"
      actions={
        <Link
          to="/founder"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back to workspace
        </Link>
      }
    >
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : !application ? (
        <div className="max-w-lg mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <Award className="mx-auto text-slate-300" size={44} />
          <h2 className="font-bold text-slate-900 text-lg">
            No active certificate
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {error ||
              "A designation certificate is issued after MinT approves your application. It will appear here automatically."}
          </p>
          <Link
            to="/founder"
            className="inline-block px-4 py-2 bg-teal-600 text-white font-semibold text-sm rounded-xl"
          >
            Return to overview
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <CertificateView application={application} />
        </div>
      )}
    </AppShell>
  );
}