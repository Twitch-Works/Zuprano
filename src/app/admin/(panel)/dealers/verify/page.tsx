"use client";

import { CircleCheck, FileText, MapPin, Phone, X } from "lucide-react";
import { useDealers } from "@/lib/admin/data";
import { Loading } from "@/components/admin/ui";

const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function VerificationPage() {
  const { dealers, loading, error, verifyDealer, rejectDealer } = useDealers();
  const pending = dealers.filter((d) => d.verificationStatus === "pending");

  if (loading) return <Loading label="Loading requests..." />;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg m-6 border border-red-100 italic">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
        <p className="text-gray-600 mt-2">Review and verify new dealer applications</p>
      </div>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
          <p className="text-gray-600">No pending verification requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pending.map((d) => {
            const gstOk = GST_RE.test(d.gstNumber.toUpperCase());
            const contactOk = d.contact.replace(/\D/g, "").length >= 10;
            return (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-xl font-bold">{d.name.charAt(0)}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{d.name}</h3>
                          <p className="text-sm text-gray-500">Applied on {d.createdAt ? new Date(d.createdAt).toLocaleDateString("en-IN") : "Recent"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone size={16} className="text-gray-400" />
                          {d.contact}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <FileText size={16} className="text-gray-400" />
                          GST: <span className="font-mono font-bold text-gray-900">{d.gstNumber || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={16} className="text-gray-400" />
                          {d.location}
                        </div>
                      </div>
                      {(d.address.street || d.address.city) && (
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                          <strong>Address:</strong> {[d.address.street, d.address.city, d.address.state].filter(Boolean).join(", ")}
                          {d.address.zip ? ` - ${d.address.zip}` : ""}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => rejectDealer(d.id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
                      >
                        <X size={18} /> Reject
                      </button>
                      <button
                        onClick={() => verifyDealer(d.id)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors"
                      >
                        <CircleCheck size={18} /> Verify Dealer
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex flex-wrap items-center gap-6">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Verification Checklist:</span>
                  <div className="flex items-center gap-4 text-[11px] font-medium text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${gstOk ? "bg-green-500" : "bg-red-500"}`} /> GST Format
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${contactOk ? "bg-green-500" : "bg-red-500"}`} /> Contact Valid
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" /> Manual Review
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
