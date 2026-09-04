import React, { useState, useEffect } from "react";
import { X, UserCheck, UserPlus, Save, AlertCircle } from "lucide-react";
import { AdminUser, adminService } from "../../services/adminService";
import { toast } from "react-toastify";

interface AdminUserModalProps {
  isOpen: boolean;
  user: AdminUser | null; // null if creating a new user
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveSuccess,
}) => {
  const isEditing = !!user;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [title, setTitle] = useState("Rookie");
  const [avatar, setAvatar] = useState("1");
  const [country, setCountry] = useState("IN");
  const [description, setDescription] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setRole(user.role === "admin" ? "admin" : "user");
      setLevel(user.level || 1);
      setXp(user.xp || 0);
      setTitle(user.title || "Rookie");
      setAvatar(user.avatar || "1");
      setCountry(user.country || "IN");
      setDescription(user.description || "");
      setIsBanned(!!user.isBanned);
    } else {
      setUsername("");
      setPassword("");
      setRole("user");
      setLevel(1);
      setXp(0);
      setTitle("Rookie");
      setAvatar("1");
      setCountry("IN");
      setDescription("");
      setIsBanned(false);
    }
    setError("");
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isEditing && user) {
        await adminService.updateUser(user._id, {
          username: username.trim(),
          password,
          role,
          level: Number(level),
          xp: Number(xp),
          title: title.trim(),
          avatar,
          country,
          description: description.trim(),
          isBanned,
        });
        toast.success(`User ${username} updated successfully!`);
      } else {
        await adminService.createUser({
          username: username.trim(),
          role,
          level: Number(level),
          xp: Number(xp),
          title: title.trim(),
        });
        toast.success(`New user ${username} created!`);
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save user details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>

            {!isEditing && <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={12} maxLength={128} required className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none" />
            </div>}
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? `Edit User: ${user?.username}` : "Create New User Account"}
              </h2>
              <p className="text-xs text-slate-400">Configure account roles, levels, and profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 mb-4 text-sm bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
                required
              />
            </div>

            {/* System Role */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "user" | "admin")}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
              >
                <option value="user">User (Standard)</option>
                <option value="admin">Administrator (Superuser)</option>
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Player Level
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            {/* XP */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Experience Points (XP)
              </label>
              <input
                type="number"
                min="0"
                value={xp}
                onChange={(e) => setXp(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Player Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Detective"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            {/* Avatar Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Avatar Preset ID
              </label>
              <select
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none"
              >
                <option value="1">Avatar 1 (Raja)</option>
                <option value="2">Avatar 2 (Rani)</option>
                <option value="3">Avatar 3 (Police)</option>
                <option value="4">Avatar 4 (Thief)</option>
                <option value="5">Avatar 5 (Crown)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Bio / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Player status note or description..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-sm focus:outline-none resize-none"
            />
          </div>

          {/* Ban toggle if editing */}
          {isEditing && (
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-red-300">Account Status</p>
                <p className="text-xs text-slate-400">Suspend user from logging in or joining rooms</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBanned}
                  onChange={(e) => setIsBanned(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? "Save Changes" : "Create User"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
