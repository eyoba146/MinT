import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/AppShell";
import { Loader2, Globe, MapPin, ExternalLink } from "lucide-react";

export default function BuildersDirectory({ embedded = false }) {
  const { isAuthenticated, user } = useAuth();
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/ecosystem-builders/public");
        setBuilders(res.data || []);
      } catch (err) {
        console.error(err);
        setBuilders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const body = (
    <>
      {!embedded && (
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Ecosystem Builders</h1>
          <p className="text-slate-600 mt-2">
            MinT-designated incubators, accelerators, hubs and support organizations.
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : builders.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500">No designated ecosystem builders published yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {builders.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl shrink-0">
                  {b.logo || "🏢"}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 truncate">
                    {b.organizationName}
                  </h2>
                  <p className="text-xs text-teal-700 capitalize mt-0.5">
                    {(b.builderType || "").replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              {b.description && (
                <p className="text-sm text-slate-600 line-clamp-3 mb-3">{b.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {b.country && (
                  <span className="inline-flex items-center gap-1">
                    <Globe size={12} /> {b.country}
                  </span>
                )}
                {b.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {b.location}
                  </span>
                )}
                {b.website && (
                  <a
                    href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                  >
                    <ExternalLink size={12} /> Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (embedded || (isAuthenticated && user?.role === "citizen")) {
    return (
      <AppShell
        title="Ecosystem builders"
        subtitle="MinT-designated support organizations"
      >
        {body}
      </AppShell>
    );
  }

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{body}</div>;
}