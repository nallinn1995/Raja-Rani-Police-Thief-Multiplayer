import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  Sparkles,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  X,
  Radio,
  ShieldAlert,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface PushData {
  metrics: {
    totalInstallations: number;
    enabledInstallations: number;
    registeredUsersWithPush: number;
    guestInstallations: number;
    isFirebaseConfigured: boolean;
  };
  recent: Array<{
    _id: string;
    title: string;
    body: string;
    targetType: "ALL" | "INSTALLATION" | "USER";
    targetId?: string | null;
    targetCount: number;
    successCount: number;
    failureCount: number;
    status: "PROCESSING" | "SENT" | "PARTIAL" | "FAILED";
    createdBy: string;
    deepLink?: string;
    createdAt: string;
    sentAt?: string;
  }>;
}

export const AdminPushNotificationTab: React.FC = () => {
  const [data, setData] = useState<PushData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("👑 Royal Battle Awaits!");
  const [message, setMessage] = useState("Gather your friends and start a new royal game now!");
  const [targetType, setTargetType] = useState<"ALL" | "INSTALLATION" | "USER">("ALL");
  const [targetId, setTargetId] = useState("");
  const [deepLink, setDeepLink] = useState("/");
  const [isSending, setIsSending] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getPushNotificationData();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load push notifications:", err);
      toast.error(err.message || "Failed to load push notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenSend = () => {
    setIsSendModalOpen(true);
  };

  const handlePrepareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.warn("Title and message are required.");
      return;
    }

    if ((targetType === "INSTALLATION" || targetType === "USER") && !targetId.trim()) {
      toast.warn(`Please provide a ${targetType === "INSTALLATION" ? "Installation ID" : "User ID"}`);
      return;
    }

    if (targetType === "ALL") {
      setIsConfirmModalOpen(true);
    } else {
      executeSend();
    }
  };

  const executeSend = async () => {
    setIsSending(true);
    try {
      const result = await adminService.sendPushNotification({
        title: title.trim(),
        body: message.trim(),
        targetType,
        targetId: targetId.trim() || null,
        deepLink: deepLink.trim() || "/",
      });

      toast.success(
        `Notification dispatch complete! (${result.result?.successCount || 0} succeeded, ${result.result?.failureCount || 0} failed)`
      );
      setIsConfirmModalOpen(false);
      setIsSendModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Notification send error:", err);
      toast.error(err.message || "Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#21073F]/80 via-[#190833]/90 to-[#21073F]/80 border border-[#FFD700]/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_15px_rgba(249,201,51,0.3)] flex items-center justify-center">
            <div className="w-full h-full bg-[#080320] rounded-[10px] flex items-center justify-center">
              <Bell className="w-6 h-6 text-[#FBE278]" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Push Notifications
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FBE278] border border-[#FFD700]/30 font-semibold">
                Phase 1
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Direct and broadcast push notifications to active browser and PWA installations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenSend}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.35)] transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>+ Send Notification</span>
          </button>
        </div>
      </div>

      {/* Backend Firebase Status Banner if not configured */}
      {data && !data.metrics.isFirebaseConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Firebase Admin credentials pending in .env</p>
            <p className="text-amber-200/80 mt-0.5 leading-relaxed">
              Add <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_PROJECT_ID</code>, <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_CLIENT_EMAIL</code>, and <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_PRIVATE_KEY</code> to enable live delivery to devices.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Enabled Installations</span>
            <div className="p-2 rounded-lg bg-[#36D978]/10 text-[#36D978]">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FBE278] to-[#FFD700]">
            {data?.metrics.enabledInstallations.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-white/50 mt-1">Permission granted & active</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <div className="p-2 rounded-lg bg-[#AC41D7]/10 text-[#AC41D7]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {data?.metrics.registeredUsersWithPush.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-white/50 mt-1">Authenticated accounts with push</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Guest Installations</span>
            <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {data?.metrics.guestInstallations.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-white/50 mt-1">Unassociated visitor devices</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recorded</span>
            <div className="p-2 rounded-lg bg-white/10 text-white/70">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {data?.metrics.totalInstallations.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-white/50 mt-1">All registered client records</p>
        </div>
      </div>

      {/* Recent Notifications Table */}
      <div className="bg-[#190833]/80 border border-[#FFD700]/20 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFD700]" />
            Recent Notifications
          </h3>
          <span className="text-xs text-white/50">{data?.recent.length || 0} logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-black/30 text-white/60 text-[11px] uppercase tracking-wider border-b border-white/5">
                <th className="py-3 px-4">Title & Message</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {data && data.recent.length > 0 ? (
                data.recent.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate">{item.title}</div>
                      <div className="text-xs text-white/60 truncate">{item.body}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs">
                        {item.targetType === "ALL"
                          ? "All Enabled"
                          : item.targetType === "USER"
                          ? `User (${item.targetId?.slice(0, 6)}...)`
                          : `Device (${item.targetId?.slice(0, 6)}...)`}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-white/50 text-xs">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      <span className="text-[#36D978] font-semibold">{item.successCount}</span>
                      <span className="text-white/40"> / </span>
                      <span className="text-white/70">{item.targetCount}</span>
                      {item.failureCount > 0 && (
                        <span className="text-red-400 text-[11px] ml-1.5">({item.failureCount} failed)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          item.status === "SENT"
                            ? "bg-[#36D978]/20 text-[#36D978] border border-[#36D978]/30"
                            : item.status === "PARTIAL"
                            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                            : item.status === "FAILED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-blue-400/20 text-blue-300 border border-blue-400/30 animate-pulse"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40 text-xs">
                    {loading ? "Loading notification history..." : "No notification logs recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Notification Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/40 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#FFD700]" />
                Send Push Notification
              </h3>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrepareSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Notification Title</span>
                  <span className={`${title.length > 100 ? "text-amber-400" : "text-white/40"}`}>
                    {title.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="👑 Royal Battle Awaits!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] text-sm transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Message Body</span>
                  <span className={`${message.length > 400 ? "text-amber-400" : "text-white/40"}`}>
                    {message.length}/500
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  placeholder="Gather your friends and start a new royal battle..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] text-sm resize-none transition-all"
                />
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Target Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType("ALL")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      targetType === "ALL"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span>All Enabled ({data?.metrics.enabledInstallations || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("INSTALLATION")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      targetType === "INSTALLATION"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span>Specific Device</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("USER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      targetType === "USER"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <span>Specific User</span>
                  </button>
                </div>
              </div>

              {/* Target ID (Conditional) */}
              {targetType !== "ALL" && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    {targetType === "INSTALLATION" ? "Target Installation ID or FID" : "Target User ObjectId"}
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                    placeholder={targetType === "INSTALLATION" ? "e.g. c_0d4e9..." : "e.g. 64f1b2c3..."}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] text-sm transition-all"
                  />
                </div>
              )}

              {/* Deep link */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Internal Route (Deep Link)</label>
                <input
                  type="text"
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  placeholder="/"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] text-sm transition-all"
                />
              </div>

              {/* Live Preview Card */}
              <div>
                <span className="block text-xs font-semibold text-white/70 mb-2">Live Notification Preview</span>
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#2B0952] to-[#1D0638] border border-[#FFD700]/50 shadow-lg text-left">
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src="/icons/icon-192x192.png"
                      alt="Icon"
                      className="w-5 h-5 rounded-md object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <span className="text-xs font-bold text-[#FBE278] tracking-wide">👑 Raja Rani</span>
                    <span className="text-[10px] text-white/40 ml-auto">now</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{title || "Notification Title"}</h4>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                    {message || "Notification message content..."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Broadcast Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#21073F] border border-[#FFD700]/60 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Send Notification?</h3>
            </div>

            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              This will send the notification to approximately{" "}
              <strong className="text-[#FFD700]">{data?.metrics.enabledInstallations || 0}</strong> active
              installations.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-xs font-semibold text-[#FBE278]">Title:</div>
              <div className="text-xs text-white font-medium">{title}</div>
              <div className="text-xs font-semibold text-[#FBE278] pt-1">Message:</div>
              <div className="text-xs text-white/80">{message}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSend}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] transition-all cursor-pointer"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Send Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
