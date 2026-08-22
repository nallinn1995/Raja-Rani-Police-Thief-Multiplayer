import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  Gamepad2,
  Trophy,
  History,
  Radio,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Ban,
  UserCheck,
  Zap,
  Activity,
  AlertTriangle,
  Send,
  Sliders,
  Award,
  Power,
  Crown,
} from "lucide-react";
import {
  adminService,
  AdminUser,
  OverviewStats,
  ActiveRoom,
  PlayerStatsRecord,
  MatchRecord,
} from "../../services/adminService";
import { AdminUserModal } from "./AdminUserModal";
import { AdminStatsModal } from "./AdminStatsModal";
import { toast } from "react-toastify";

interface AdminDashboardProps {
  onBackToApp: () => void;
  onLogout: () => void;
}

import { DetectiveAdminTab } from "../detectiveChallenge/DetectiveAdminTab";
import { ModernAdminTab } from "../modernMode/ModernAdminTab";

type TabType = "overview" | "users" | "rooms" | "classic-admin" | "detective-challenge" | "modern-mode" | "stats" | "matches" | "system";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToApp,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(false);

  // Overview State
  const [overview, setOverview] = useState<OverviewStats | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Rooms State
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);

  // Stats State
  const [playerStats, setPlayerStats] = useState<PlayerStatsRecord[]>([]);
  const [statsSearch, setStatsSearch] = useState("");
  const [selectedStatsRecord, setSelectedStatsRecord] = useState<PlayerStatsRecord | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Matches State
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [matchSearch, setMatchSearch] = useState("");
  const [matchModeFilter, setMatchModeFilter] = useState("");

  // System & Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"info" | "success" | "warning" | "error">("info");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  // Fetch Data according to Active Tab
  const loadOverview = useCallback(async () => {
    try {
      const data = await adminService.getOverview();
      setOverview(data);
      if (data.systemConfig) {
        setMaintenanceMode(data.systemConfig.maintenanceMode);
        setMaintenanceMsg(data.systemConfig.maintenanceMessage);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load overview data");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(userSearch, userRoleFilter);
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, [userSearch, userRoleFilter]);

  const loadActiveRooms = useCallback(async () => {
    try {
      setLoading(true);
      const rooms = await adminService.getActiveRooms();
      setActiveRooms(rooms);
    } catch (err: any) {
      toast.error(err.message || "Failed to load active rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlayerStats = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await adminService.getPlayerStats(statsSearch);
      setPlayerStats(stats);
    } catch (err: any) {
      toast.error(err.message || "Failed to load player stats");
    } finally {
      setLoading(false);
    }
  }, [statsSearch]);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      const list = await adminService.getMatches(matchSearch, matchModeFilter);
      setMatches(list);
    } catch (err: any) {
      toast.error(err.message || "Failed to load match history");
    } finally {
      setLoading(false);
    }
  }, [matchSearch, matchModeFilter]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    if (activeTab === "users") loadUsers();
    if (activeTab === "rooms") loadActiveRooms();
    if (activeTab === "stats") loadPlayerStats();
    if (activeTab === "matches") loadMatches();
  }, [activeTab, loadOverview, loadUsers, loadActiveRooms, loadPlayerStats, loadMatches]);

  // User Actions
  const handleToggleBan = async (user: AdminUser) => {
    try {
      const newStatus = await adminService.toggleBanUser(user._id);
      toast.info(`User ${user.username} is now ${newStatus ? "banned" : "unbanned"}`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to change user ban status");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) {
      return;
    }
    try {
      await adminService.deleteUser(user._id);
      toast.success(`User ${user.username} deleted.`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  // Room Actions
  const handleCloseRoom = async (roomCode: string) => {
    if (!window.confirm(`Terminate active room ${roomCode}? All connected players will be disconnected.`)) {
      return;
    }
    try {
      await adminService.closeRoom(roomCode);
      toast.success(`Room ${roomCode} terminated.`);
      loadActiveRooms();
    } catch (err: any) {
      toast.error(err.message || "Failed to terminate room");
    }
  };

  const handleKickPlayer = async (roomCode: string, playerId: string, playerName: string) => {
    try {
      await adminService.kickPlayer(roomCode, playerId);
      toast.info(`Player ${playerName} kicked from room ${roomCode}`);
      loadActiveRooms();
    } catch (err: any) {
      toast.error(err.message || "Failed to kick player");
    }
  };

  // Match History Actions
  const handleDeleteMatch = async (id: string) => {
    try {
      await adminService.deleteMatch(id);
      toast.success("Match record deleted");
      loadMatches();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete match");
    }
  };

  const handleClearAllMatches = async () => {
    if (!window.confirm("WARNING: Clear ALL match history records from the database? This cannot be undone!")) {
      return;
    }
    try {
      await adminService.clearAllMatches();
      toast.success("All match records cleared");
      loadMatches();
    } catch (err: any) {
      toast.error(err.message || "Failed to clear match history");
    }
  };

  // Broadcast & System Config
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      await adminService.broadcastAnnouncement(broadcastMessage.trim(), broadcastType);
      toast.success("Announcement broadcasted live to all players!");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send announcement");
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode;
    try {
      await adminService.updateSystemConfig({
        maintenanceMode: nextState,
        maintenanceMessage: maintenanceMsg || "Server is under maintenance.",
      });
      setMaintenanceMode(nextState);
      toast.info(`Maintenance mode is now ${nextState ? "ENABLED" : "DISABLED"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update maintenance mode");
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-6 py-3.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-xl text-black shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black bg-gradient-to-r from-amber-400 via-yellow-200 to-white bg-clip-text text-transparent">
                Raja Rani Admin Portal
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                Superuser
              </span>
            </div>
            <p className="text-xs text-slate-400">Full System Control & Real-time Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {overview && (
            <div className="hidden md:flex items-center space-x-3 text-xs bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-slate-400">Uptime:</span>
                <span className="font-semibold text-emerald-400">{formatUptime(overview.uptimeSeconds)}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center space-x-1 text-amber-400">
                <Radio className="w-3.5 h-3.5" />
                <span>Sockets: {overview.connectedSockets}</span>
              </div>
            </div>
          )}

          <button
            onClick={onBackToApp}
            className="flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Game</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "User Accounts", icon: Users },
            { id: "rooms", label: "Active Rooms", icon: Gamepad2, badge: overview?.activeRoomsCount },
            { id: "classic-admin", label: "Classic Mode Stats", icon: Award },
            { id: "detective-challenge", label: "Detective Challenge", icon: Search },
            { id: "modern-mode", label: "Modern Kingdom Mode", icon: Crown },
            { id: "stats", label: "All Player Directory", icon: Trophy },
            { id: "matches", label: "Match Logs", icon: History },
            { id: "system", label: "Broadcast & Config", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-black" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                      isActive ? "bg-black text-amber-400" : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && overview && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">System Analytics & Quick Controls</h2>
                  <p className="text-xs text-slate-400">Real-time status of application servers and databases</p>
                </div>
                <button
                  onClick={loadOverview}
                  className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title="Refresh Metrics"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{overview.totalUsers}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{overview.totalAdmins} Admins, {overview.totalBanned} Banned</p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Rooms</span>
                    <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{overview.activeRoomsCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{overview.totalPlayersInRooms} Players active in rooms</p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Matches</span>
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{overview.totalMatches}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Across all 3 game modes</p>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Sockets</span>
                    <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                  </div>
                  <p className="text-3xl font-black text-white">{overview.connectedSockets}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Active WebSocket clients</p>
                </div>
              </div>

              {/* Game Modes Breakdown Analytics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Award className="w-4 h-4" />
                      <span>Classic Points Mode</span>
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 rounded">
                      4 Players
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Total Matches Logged:</span>
                      <strong className="text-white">{overview.classicMatchesCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Active Live Rooms:</span>
                      <strong className="text-amber-400">{overview.classicRoomsCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Recorded Players:</span>
                      <strong className="text-white">{overview.totalStatsRecords || 0}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Search className="w-4 h-4" />
                      <span>Detective Challenge</span>
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 rounded">
                      Police vs Thief
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Total Matches Logged:</span>
                      <strong className="text-white">{overview.policeThiefMatchesCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Active Live Rooms:</span>
                      <strong className="text-cyan-400">{overview.policeThiefRoomsCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Detective Records:</span>
                      <strong className="text-white">{overview.totalDcStatsRecords || 0}</strong>
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-purple-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Trophy className="w-4 h-4" />
                      <span>Modern Kingdom</span>
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-purple-500/20 text-purple-300 rounded">
                      6 Roles
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <p className="flex justify-between">
                      <span className="text-slate-400">Total Matches Logged:</span>
                      <strong className="text-white">{overview.modernMatchesCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Active Live Rooms:</span>
                      <strong className="text-purple-400">{overview.modernRoomsCount || 0}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400">Kingdom Records:</span>
                      <strong className="text-white">{overview.totalModernStatsRecords || 0}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Maintenance Mode Alert Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                maintenanceMode
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}>
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`w-6 h-6 shrink-0 ${maintenanceMode ? "animate-bounce text-amber-400" : "text-emerald-400"}`} />
                  <div>
                    <h3 className="text-sm font-bold">
                      System Status: {maintenanceMode ? "MAINTENANCE MODE ACTIVE" : "OPERATIONAL & ONLINE"}
                    </h3>
                    <p className="text-xs opacity-80">
                      {maintenanceMode
                        ? "New players are blocked from starting or joining games."
                        : "All game services, socket protocols, and database operations are online."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    maintenanceMode
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                >
                  {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
                </button>
              </div>

              {/* System Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Server Node Environment</span>
                  </h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Node Environment: <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded">Active</code></p>
                    <p>Heap Used: <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded">{Math.round((overview.serverMemory?.heapUsed || 0) / 1024 / 1024)} MB</code></p>
                    <p>Heap Total: <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded">{Math.round((overview.serverMemory?.heapTotal || 0) / 1024 / 1024)} MB</code></p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                    <Sliders className="w-4 h-4" />
                    <span>Game Mode Rules & Configuration</span>
                  </h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Raja Score: <span className="text-emerald-400 font-bold">1000 pts</span> | Rani Score: <span className="text-purple-400 font-bold">800 pts</span></p>
                    <p>Police Catch: <span className="text-blue-400 font-bold">500 pts</span> | Thief Escape: <span className="text-amber-400 font-bold">800 pts</span></p>
                    <p>Max Room Limit: <span className="text-white font-bold">{overview.systemConfig?.maxPlayersPerRoom || 10} Players</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">User Accounts ({users.length})</h2>
                  <p className="text-xs text-slate-400">Search, create, update roles, tune stats, or ban users</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserForEdit(null);
                    setIsUserModalOpen(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New User</span>
                </button>
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by username..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User Role Only</option>
                  <option value="admin">Admin Role Only</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Level / XP</th>
                      <th className="p-3.5">Title</th>
                      <th className="p-3.5">Games / Wins</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Loading user data...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5 font-bold text-white flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold">
                              {u.avatar || "1"}
                            </div>
                            <span>{u.username}</span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded-md font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {u.role || "user"}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            Lvl {u.level || 1} <span className="text-slate-500">({u.xp || 0} XP)</span>
                          </td>
                          <td className="p-3.5 text-amber-400 font-medium">{u.title || "Rookie"}</td>
                          <td className="p-3.5 text-slate-300">
                            {u.totalGames || 0} games / <span className="text-emerald-400 font-bold">{u.totalWins || 0} W</span>
                          </td>
                          <td className="p-3.5">
                            {u.isBanned ? (
                              <span className="px-2 py-0.5 text-[10px] rounded-md font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                Banned
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] rounded-md font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            <button
                              onClick={() => {
                                setSelectedUserForEdit(u);
                                setIsUserModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleBan(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.isBanned
                                  ? "text-emerald-400 hover:bg-emerald-500/20 bg-slate-800"
                                  : "text-amber-400 hover:bg-amber-500/20 bg-slate-800"
                              }`}
                              title={u.isBanned ? "Unban Account" : "Ban Account"}
                            >
                              {u.isBanned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE ROOMS */}
          {activeTab === "rooms" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Live Active Rooms ({activeRooms.length})</h2>
                  <p className="text-xs text-slate-400">Monitor in-memory game rooms, kick problem players, or terminate stuck rooms</p>
                </div>
                <button
                  onClick={loadActiveRooms}
                  className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  title="Refresh Rooms"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {activeRooms.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-950/40 border border-slate-800 rounded-2xl">
                  <Gamepad2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-semibold text-sm">No active game rooms currently running.</p>
                  <p className="text-xs text-slate-600 mt-1">When players create room lobbies, they will appear here live.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                  {activeRooms.map((room) => (
                    <div key={room.roomCode} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                            {room.roomCode}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 rounded-md">
                            {room.mode}
                          </span>
                        </div>

                        <button
                          onClick={() => handleCloseRoom(room.roomCode)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Close Room</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between border-y border-slate-800/80 py-2">
                        <span>Round: <strong className="text-white">{room.currentRound} / {room.rounds}</strong></span>
                        <span>State: <strong className="text-emerald-400 uppercase">{room.gameState}</strong></span>
                        <span>Players: <strong className="text-white">{room.playersCount}</strong></span>
                      </div>

                      {/* Players list */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connected Players:</p>
                        {room.players.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900/80 rounded-xl text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white">{p.name}</span>
                              {p.isHost && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-500/20 text-amber-300 rounded">
                                  HOST
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-slate-400">{p.score} pts</span>
                              <button
                                onClick={() => handleKickPlayer(room.roomCode, p.id, p.name)}
                                className="px-2 py-0.5 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                              >
                                Kick
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB DETECTIVE CHALLENGE */}
          {activeTab === "detective-challenge" && <DetectiveAdminTab />}

          {/* TAB 4: PLAYER STATS */}
          {activeTab === "stats" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Player Statistics Records ({playerStats.length})</h2>
                  <p className="text-xs text-slate-400">View and edit lifetime experience points, win streaks, and role metrics</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search player by username..."
                  value={statsSearch}
                  onChange={(e) => setStatsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex-1 overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Player</th>
                      <th className="p-3.5">Level / Title</th>
                      <th className="p-3.5">XP</th>
                      <th className="p-3.5">Wins / Losses</th>
                      <th className="p-3.5">Win Streak</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          Loading statistics...
                        </td>
                      </tr>
                    ) : playerStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No stats records found matching query.
                        </td>
                      </tr>
                    ) : (
                      playerStats.map((st) => (
                        <tr key={st._id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5 font-bold text-white">{st.username}</td>
                          <td className="p-3.5 text-amber-400 font-semibold">
                            Lvl {st.level} - <span className="text-slate-300">{st.title}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">{st.xp} XP</td>
                          <td className="p-3.5 text-slate-300">
                            <span className="text-emerald-400 font-bold">{st.totalWins} W</span> /{" "}
                            <span className="text-red-400">{st.totalLosses} L</span>
                          </td>
                          <td className="p-3.5 font-bold text-purple-400">{st.currentWinStreak} (Best: {st.longestWinStreak})</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedStatsRecord(st);
                                setIsStatsModalOpen(true);
                              }}
                              className="px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                            >
                              Edit Stats
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MATCH HISTORY */}
          {activeTab === "matches" && (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Match History Logs ({matches.length})</h2>
                  <p className="text-xs text-slate-400">Review completed match statistics and clear old records</p>
                </div>
                <button
                  onClick={handleClearAllMatches}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Records</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by room code or winner..."
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setMatchModeFilter("")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matchModeFilter === "" ? "bg-amber-500 text-black shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Modes
                  </button>
                  <button
                    onClick={() => setMatchModeFilter("CLASSIC_POINTS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matchModeFilter === "CLASSIC_POINTS" ? "bg-amber-500 text-black shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    👑 Classic
                  </button>
                  <button
                    onClick={() => setMatchModeFilter("DETECTIVE_CHALLENGE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matchModeFilter === "DETECTIVE_CHALLENGE" ? "bg-cyan-500 text-black shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🔍 Detective Challenge
                  </button>
                  <button
                    onClick={() => setMatchModeFilter("MODERN_MODE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      matchModeFilter === "MODERN_MODE" ? "bg-purple-500 text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🏰 Modern Kingdom
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Room Code</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5">Winner</th>
                      <th className="p-3.5">Players & Scores</th>
                      <th className="p-3.5">Duration</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          Loading match history...
                        </td>
                      </tr>
                    ) : matches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No match history records found.
                        </td>
                      </tr>
                    ) : (
                      matches.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="p-3.5 font-bold text-amber-400">{m.roomCode}</td>
                          <td className="p-3.5 text-slate-300">{m.gameMode}</td>
                          <td className="p-3.5 font-bold text-emerald-400">{m.winnerUsername}</td>
                          <td className="p-3.5 text-slate-300">
                            {m.players && m.players.length > 0
                              ? m.players.map((p) => {
                                  const name = p.username || (p as any).name || "Player";
                                  const scoreVal = p.score ?? (p as any).finalScore ?? (p as any).baseScore ?? 0;
                                  return `${name} (${scoreVal})`;
                                }).join(", ")
                              : "No Players"}
                          </td>
                          <td className="p-3.5 text-slate-400">{m.duration || 0}s</td>
                          <td className="p-3.5 text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteMatch(m._id)}
                              className="p-1.5 text-red-400 hover:text-red-300 bg-slate-800 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5.2: CLASSIC MODE DEDICATED ANALYTICS */}
          {activeTab === "classic-admin" && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>Classic Mode Analytics (Points Based)</span>
                  </h2>
                  <p className="text-xs text-slate-400">Classic Raja Rani Game Records, Point Totals, and Player Leaderboards</p>
                </div>
                <button
                  onClick={loadOverview}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition-all self-start"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh Overview</span>
                </button>
              </div>

              {/* 4 Classic Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/70 border border-amber-500/30 rounded-2xl">
                  <span className="text-[11px] font-bold text-amber-400 uppercase block">Total Classic Games</span>
                  <span className="text-3xl font-black text-white mt-1 block">
                    {overview?.totalMatches || 0}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/70 border border-yellow-500/30 rounded-2xl">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase block">Total Registered Players</span>
                  <span className="text-3xl font-black text-yellow-300 mt-1 block">
                    {overview?.registeredUsersCount || 0}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/70 border border-emerald-500/30 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase block">Active Game Rooms</span>
                  <span className="text-3xl font-black text-emerald-300 mt-1 block">
                    {overview?.activeRoomsCount || 0}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/70 border border-indigo-500/30 rounded-2xl">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase block">Online System Sockets</span>
                  <span className="text-3xl font-black text-indigo-300 mt-1 block">
                    {overview?.connectedSockets || 0}
                  </span>
                </div>
              </div>

              {/* Classic Mode Role Point Rules Overview */}
              <div className="p-5 bg-slate-950/70 border border-amber-500/30 rounded-2xl space-y-3">
                <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Classic Mode Point Distribution Rules</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-900 border border-yellow-500/30 rounded-xl">
                    <span className="font-bold text-yellow-400 block text-xs">👑 Raja (King)</span>
                    <span className="text-lg font-black text-white mt-1 block">+1000 pts</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-pink-500/30 rounded-xl">
                    <span className="font-bold text-pink-400 block text-xs">👸 Rani (Queen)</span>
                    <span className="text-lg font-black text-white mt-1 block">+800 pts</span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl">
                    <span className="font-bold text-blue-400 block text-xs">👮 Police</span>
                    <span className="text-lg font-black text-white mt-1 block">+500 pts (Correct)</span>
                  </div>
                  <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl">
                    <span className="font-bold text-emerald-400 block text-xs">🥷 Thief</span>
                    <span className="text-lg font-black text-white mt-1 block">+500 pts (Escape)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5.5: MODERN KINGDOM MODE DEDICATED DASHBOARD */}
          {activeTab === "modern-mode" && <ModernAdminTab />}

          {/* TAB 6: BROADCAST & SYSTEM CONFIG */}
          {activeTab === "system" && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-white">Broadcast Alerts & System Configuration</h2>
                <p className="text-xs text-slate-400">Send real-time alerts to all connected players or adjust system parameters</p>
              </div>

              {/* Broadcast Form */}
              <form onSubmit={handleSendBroadcast} className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2">
                  <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-white">Send Real-time System Announcement</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Announcement Message
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Server maintenance scheduled in 10 minutes!"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type:</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="info">Info Alert (Blue)</option>
                      <option value="success">Success Alert (Green)</option>
                      <option value="warning">Warning Alert (Amber)</option>
                      <option value="error">Critical Error (Red)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast Alert Now</span>
                  </button>
                </div>
              </form>

              {/* Maintenance Toggle */}
              <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Server Maintenance Switch</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    When enabled, restricts players from creating or joining rooms until maintenance completes.
                  </p>
                </div>
                <button
                  onClick={handleToggleMaintenance}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all ${
                    maintenanceMode
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  }`}
                >
                  {maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AdminUserModal
        isOpen={isUserModalOpen}
        user={selectedUserForEdit}
        onClose={() => setIsUserModalOpen(false)}
        onSaveSuccess={loadUsers}
      />

      <AdminStatsModal
        isOpen={isStatsModalOpen}
        statsRecord={selectedStatsRecord}
        onClose={() => setIsStatsModalOpen(false)}
        onSaveSuccess={loadPlayerStats}
      />
    </div>
  );
};
