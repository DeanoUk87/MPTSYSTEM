"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, MapPin, Trash2 } from "lucide-react";

interface Address {
  name: string; address1: string; address2: string; area: string;
  postcode: string; country: string; contact: string; phone: string;
  bookingId: string; type: "collection" | "delivery";
}

const HIDDEN_KEY = "mp_hidden_addresses";

function getHidden(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]")); } catch { return new Set(); }
}
function hideAddress(key: string) {
  const h = getHidden(); h.add(key);
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...h]));
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { setHidden(getHidden()); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/addresses${params}`);
    if (res.ok) setAddresses(await res.json());
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  function handleDelete(a: Address) {
    const key = `${a.name.toLowerCase()}||${a.postcode.toLowerCase()}`;
    hideAddress(key);
    setHidden(prev => new Set([...prev, key]));
  }

  const visible = addresses.filter(a => !hidden.has(`${a.name.toLowerCase()}||${a.postcode.toLowerCase()}`));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Addresses</h1>
          <p className="text-sm text-slate-500 mt-0.5">All unique addresses from bookings — search by name or postcode</p>
        </div>
        <span className="text-sm text-slate-400">{visible.length} addresses</span>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, postcode or address..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">No addresses found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{a.name || <span className="text-slate-400 italic">Unnamed</span>}</p>
                  <div className="mt-1 space-y-0.5 text-sm text-slate-500">
                    {a.address1 && <p className="truncate">{a.address1}</p>}
                    {a.address2 && <p className="truncate">{a.address2}</p>}
                    {a.area && <p className="truncate">{a.area}</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {a.postcode && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">
                        <MapPin className="w-3 h-3" /> {a.postcode}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.type === "collection" ? "bg-green-50 text-green-700"
                      : a.type === "via" ? "bg-indigo-50 text-indigo-700"
                      : "bg-purple-50 text-purple-700"
                    }`}>
                      {a.type}
                    </span>
                  </div>
                  {(a.contact || a.phone) && (
                    <div className="mt-2 text-xs text-slate-400">
                      {a.contact && <span>{a.contact}</span>}
                      {a.contact && a.phone && <span> · </span>}
                      {a.phone && <span>{a.phone}</span>}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => handleDelete(a)}
                  className="shrink-0 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove from address book">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
