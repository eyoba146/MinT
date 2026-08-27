import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import { Loader2, Globe, MapPin, ExternalLink } from "lucide-react";

export default function CitizenBuilders() {
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

  return (
    <AppShell
      title="Ecosystem builders"
      subtitle="MinT-designated incubators, hubs and support organizations"
    >
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : builders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">
            No designated ecosystem builders published yet.
          </p>
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
                <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                  {b.description}
                </p>
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
                    href={
                      b.website.startsWith("http")
                        ? b.website
                        : `https://${b.website}`
                    }
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
    </AppShell>
  );
}