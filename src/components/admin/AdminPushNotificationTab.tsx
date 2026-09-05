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
  Calendar,
  Repeat,
  Play,
  Pause,
  Ban,
  Trash2,
  Copy,
  Plus,
  FileText,
  Eye,
  History,
  Check,
  Zap,
  Target,
  BarChart3,
  Download,
  Sliders,
} from "lucide-react";
import {
  adminService,
  NotificationCampaignItem,
  NotificationCampaignRunItem,
  NotificationTemplateItem,
  AutomaticEventConfigItem,
  AudienceEstimateResult,
  NotificationAnalyticsSummary,
} from "../../services/adminService";
import { pushNotificationService } from "../../services/pushNotificationService";
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

const SUPPORTED_TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (India Standard Time - IST +5:30)" },
  { value: "America/New_York", label: "America/New_York (Eastern Time - US)" },
  { value: "Europe/London", label: "Europe/London (Greenwich Mean Time - GMT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (Gulf Standard Time +4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT +8:00)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

export const AdminPushNotificationTab: React.FC = () => {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "campaigns" | "templates" | "automatic" | "audience" | "analytics"
  >("overview");

  // Phase 1 Overview State
  const [data, setData] = useState<PushData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Send Now Form
  const [sendTitle, setSendTitle] = useState("👑 Royal Battle Awaits!");
  const [sendMessage, setSendMessage] = useState("Gather your friends and start a new royal game now!");
  const [sendTargetType, setSendTargetType] = useState<"ALL" | "INSTALLATION" | "USER">("ALL");
  const [sendTargetId, setSendTargetId] = useState("");
  const [sendDeepLink, setSendDeepLink] = useState("/");

  // Phase 2 Campaigns State
  const [campaigns, setCampaigns] = useState<NotificationCampaignItem[]>([]);
  const [campaignStats, setCampaignStats] = useState<{
    totalCampaigns: number;
    activeRecurring: number;
    scheduledOneTime: number;
    totalRuns: number;
  }>({ totalCampaigns: 0, activeRecurring: 0, scheduledOneTime: 0, totalRuns: 0 });
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [isConfirmCampaignOpen, setIsConfirmCampaignOpen] = useState(false);

  // Campaign Form State
  const [campName, setCampName] = useState("");
  const [campType, setCampType] = useState<"ONE_TIME" | "RECURRING">("ONE_TIME");
  const [campTitle, setCampTitle] = useState("");
  const [campBody, setCampBody] = useState("");
  const [campAudience, setCampAudience] = useState<
    "ALL_ENABLED" | "REGISTERED_USERS" | "SPECIFIC_USER" | "SPECIFIC_INSTALLATION"
  >("ALL_ENABLED");
  const [campTargetId, setCampTargetId] = useState("");
  const [campDeepLink, setCampDeepLink] = useState("/");
  const [campTimezone, setCampTimezone] = useState("Asia/Kolkata");
  const [campStartDate, setCampStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [campEndDate, setCampEndDate] = useState("");
  const [campTimeOfDay, setCampTimeOfDay] = useState("20:00");
  const [campFrequency, setCampFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [campDaysOfWeek, setCampDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [campDayOfMonth, setCampDayOfMonth] = useState<number>(1);
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);

  // Execution History Drawer/Modal
  const [selectedCampaignRuns, setSelectedCampaignRuns] = useState<{
    campaign: NotificationCampaignItem;
    runs: NotificationCampaignRunItem[];
  } | null>(null);

  // Phase 2 Templates State
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tmplName, setTmplName] = useState("");
  const [tmplCategory, setTmplCategory] = useState<
    "GENERAL" | "GAME" | "EVENT" | "REMINDER" | "REWARD" | "ANNOUNCEMENT"
  >("GAME");
  const [tmplTitle, setTmplTitle] = useState("");
  const [tmplBody, setTmplBody] = useState("");
  const [tmplDeepLink, setTmplDeepLink] = useState("/");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Phase 3: Automatic Game Events State
  const [autoEvents, setAutoEvents] = useState<AutomaticEventConfigItem[]>([]);
  const [autoEventsLoading, setAutoEventsLoading] = useState(false);
  const [isAutoEventModalOpen, setIsAutoEventModalOpen] = useState(false);
  const [editingAutoEvent, setEditingAutoEvent] = useState<AutomaticEventConfigItem | null>(null);
  const [autoEventEnabled, setAutoEventEnabled] = useState(true);
  const [autoEventTitle, setAutoEventTitle] = useState("");
  const [autoEventBody, setAutoEventBody] = useState("");
  const [autoEventDeepLink, setAutoEventDeepLink] = useState("/");
  const [autoEventCooldown, setAutoEventCooldown] = useState(15);
  const [isSavingAutoEvent, setIsSavingAutoEvent] = useState(false);

  // Phase 3: Audience Estimator State
  const [audLevelMin, setAudLevelMin] = useState<string>("");
  const [audLevelMax, setAudLevelMax] = useState<string>("");
  const [audLastPlayedDays, setAudLastPlayedDays] = useState<string>("");
  const [audGameMode, setAudGameMode] = useState<string>("ALL");
  const [audOnlyPushEnabled, setAudOnlyPushEnabled] = useState(true);
  const [audEstimate, setAudEstimate] = useState<AudienceEstimateResult | null>(null);
  const [isEstimatingAudience, setIsEstimatingAudience] = useState(false);

  // Phase 3: Analytics State
  const [analyticsRange, setAnalyticsRange] = useState<string>("last7days");
  const [analyticsData, setAnalyticsData] = useState<NotificationAnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Fetch Overview Data
  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await adminService.getPushNotificationData();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load push notifications:", err);
      if (showSpinner) toast.error(err.message || "Failed to load push notifications");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  // Fetch Campaigns
  const fetchCampaigns = useCallback(async (showSpinner = true) => {
    if (showSpinner) setCampaignLoading(true);
    try {
      const res = await adminService.getCampaigns();
      setCampaigns(res.campaigns);
      setCampaignStats(res.stats);
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      if (showSpinner) toast.error(err.message || "Failed to load campaigns");
    } finally {
      if (showSpinner) setCampaignLoading(false);
    }
  }, []);

  // Fetch Templates
  const fetchTemplates = useCallback(async (showSpinner = true) => {
    if (showSpinner) setTemplateLoading(true);
    try {
      const res = await adminService.getTemplates();
      setTemplates(res.templates);
    } catch (err: any) {
      console.error("Failed to load templates:", err);
      if (showSpinner) toast.error(err.message || "Failed to load templates");
    } finally {
      if (showSpinner) setTemplateLoading(false);
    }
  }, []);

  // Phase 3: Fetch Automatic Events
  const fetchAutoEvents = useCallback(async (showSpinner = true) => {
    if (showSpinner) setAutoEventsLoading(true);
    try {
      const res = await adminService.getAutomaticEvents();
      setAutoEvents(res.configs || []);
    } catch (err: any) {
      console.error("Failed to load automatic events:", err);
      if (showSpinner) toast.error(err.message || "Failed to load automatic events");
    } finally {
      if (showSpinner) setAutoEventsLoading(false);
    }
  }, []);

  // Phase 3: Fetch Analytics
  const fetchAnalytics = useCallback(async (range = analyticsRange, showSpinner = true) => {
    if (showSpinner) setAnalyticsLoading(true);
    try {
      const res = await adminService.getNotificationAnalytics({ range });
      setAnalyticsData(res);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      if (showSpinner) toast.error(err.message || "Failed to load analytics");
    } finally {
      if (showSpinner) setAnalyticsLoading(false);
    }
  }, [analyticsRange]);

  // Phase 3: Estimate Audience Reach
  const handleEstimateAudience = async () => {
    setIsEstimatingAudience(true);
    try {
      const payload: any = {
        onlyPushEnabled: audOnlyPushEnabled,
      };
      if (audLevelMin.trim()) payload.levelMin = Number(audLevelMin);
      if (audLevelMax.trim()) payload.levelMax = Number(audLevelMax);
      if (audLastPlayedDays.trim()) payload.lastPlayedDays = Number(audLastPlayedDays);
      if (audGameMode && audGameMode !== "ALL") payload.gameMode = audGameMode;

      const res = await adminService.estimateAudience(payload);
      setAudEstimate(res.estimate);
      toast.success("Audience reach recalculated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate audience estimate");
    } finally {
      setIsEstimatingAudience(false);
    }
  };

  // Phase 3: Apply Audience to Campaign
  const handleApplyAudienceToCampaign = () => {
    setActiveSubTab("campaigns");
    setIsCampaignModalOpen(true);
    setCampName(
      `Audience Filter [${audGameMode !== "ALL" ? audGameMode : "All Modes"}${
        audLevelMin ? ` Lvl>${audLevelMin}` : ""
      }]`
    );
    toast.info("Transferred audience filter context to campaign builder!");
  };

  // Phase 3: Export CSV
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const blob = await adminService.exportAnalyticsCsv(analyticsRange);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notification_analytics_${analyticsRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Analytics CSV exported successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export CSV");
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Phase 3: Auto Event Handlers
  const handleEditAutoEvent = (cfg: AutomaticEventConfigItem) => {
    setEditingAutoEvent(cfg);
    setAutoEventEnabled(cfg.enabled);
    setAutoEventTitle(cfg.titleTemplate);
    setAutoEventBody(cfg.bodyTemplate);
    setAutoEventDeepLink(cfg.deepLinkTemplate || "/");
    setAutoEventCooldown(cfg.cooldownMinutes);
    setIsAutoEventModalOpen(true);
  };

  const handleToggleAutoEventQuick = async (cfg: AutomaticEventConfigItem) => {
    try {
      const nextEnabled = !cfg.enabled;
      await adminService.updateAutomaticEvent(cfg.eventType, { enabled: nextEnabled });
      setAutoEvents((prev) =>
        prev.map((item) => (item.eventType === cfg.eventType ? { ...item, enabled: nextEnabled } : item))
      );
      toast.success(`${cfg.displayName} ${nextEnabled ? "enabled" : "disabled"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update event state");
    }
  };

  const handleSaveAutoEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAutoEvent) return;
    setIsSavingAutoEvent(true);
    try {
      const res = await adminService.updateAutomaticEvent(editingAutoEvent.eventType, {
        enabled: autoEventEnabled,
        titleTemplate: autoEventTitle.trim(),
        bodyTemplate: autoEventBody.trim(),
        deepLinkTemplate: autoEventDeepLink.trim(),
        cooldownMinutes: Number(autoEventCooldown),
      });
      setAutoEvents((prev) =>
        prev.map((item) => (item.eventType === editingAutoEvent.eventType ? res.config : item))
      );
      setIsAutoEventModalOpen(false);
      toast.success(`Updated ${res.config.displayName} config!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save automatic event config");
    } finally {
      setIsSavingAutoEvent(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    fetchCampaigns(false);
    fetchTemplates(false);
    pushNotificationService.handleLogin().catch(() => {});

    // Polling interval
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchData(false);
      if (activeSubTab === "campaigns") fetchCampaigns(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchData, fetchCampaigns, fetchTemplates, activeSubTab]);

  // Handle tab switch data prefetching
  useEffect(() => {
    if (activeSubTab === "automatic" && autoEvents.length === 0) {
      fetchAutoEvents(true);
    } else if (activeSubTab === "analytics") {
      fetchAnalytics(analyticsRange, true);
    } else if (activeSubTab === "audience" && !audEstimate) {
      handleEstimateAudience();
    }
  }, [activeSubTab, analyticsRange, autoEvents.length, audEstimate, fetchAutoEvents, fetchAnalytics]);

  // --- SEND NOW ACTIONS ---
  const handleOpenSend = () => {
    setIsSendModalOpen(true);
  };

  const handlePrepareSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTitle.trim() || !sendMessage.trim()) {
      toast.warn("Title and message are required.");
      return;
    }

    if ((sendTargetType === "INSTALLATION" || sendTargetType === "USER") && !sendTargetId.trim()) {
      toast.warn(`Please provide a ${sendTargetType === "INSTALLATION" ? "Installation ID" : "User ID"}`);
      return;
    }

    if (sendTargetType === "ALL") {
      setIsConfirmModalOpen(true);
    } else {
      executeSendNow();
    }
  };

  const executeSendNow = async () => {
    setIsSending(true);
    try {
      const result = await adminService.sendPushNotification({
        title: sendTitle.trim(),
        body: sendMessage.trim(),
        targetType: sendTargetType,
        targetId: sendTargetId.trim() || null,
        deepLink: sendDeepLink.trim() || "/",
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

  // --- CAMPAIGN ACTIONS ---
  const handleOpenCreateCampaign = () => {
    setEditingCampaignId(null);
    setCampName("");
    setCampType("ONE_TIME");
    setCampTitle("👑 Your Kingdom Awaits!");
    setCampBody("Gather your friends and start a Royal Battle tonight.");
    setCampAudience("ALL_ENABLED");
    setCampTargetId("");
    setCampDeepLink("/");
    setCampTimezone("Asia/Kolkata");
    setCampStartDate(new Date().toISOString().split("T")[0]);
    setCampEndDate("");
    setCampTimeOfDay("20:00");
    setCampFrequency("DAILY");
    setCampDaysOfWeek([1, 3, 5]);
    setCampDayOfMonth(1);
    setIsCampaignModalOpen(true);
  };

  const handleEditCampaign = (camp: NotificationCampaignItem) => {
    setEditingCampaignId(camp._id);
    setCampName(camp.name);
    setCampType(camp.type);
    setCampTitle(camp.title);
    setCampBody(camp.body);
    setCampAudience(camp.targetType);
    setCampTargetId(
      camp.targetType === "SPECIFIC_USER"
        ? camp.targetUserIds?.[0] || ""
        : camp.targetInstallationIds?.[0] || ""
    );
    setCampDeepLink(camp.deepLink || "/");
    setCampTimezone(camp.schedule.timezone || "Asia/Kolkata");
    setCampStartDate(
      camp.schedule.startAt ? new Date(camp.schedule.startAt).toISOString().split("T")[0] : ""
    );
    setCampEndDate(
      camp.schedule.endAt ? new Date(camp.schedule.endAt).toISOString().split("T")[0] : ""
    );
    setCampTimeOfDay(camp.schedule.recurrence?.timeOfDay || "20:00");
    setCampFrequency(camp.schedule.recurrence?.frequency || "DAILY");
    setCampDaysOfWeek(camp.schedule.recurrence?.daysOfWeek || [1, 3, 5]);
    setCampDayOfMonth(camp.schedule.recurrence?.dayOfMonth || 1);
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim() || !campTitle.trim() || !campBody.trim()) {
      toast.warn("Campaign name, title, and body are required.");
      return;
    }

    if (
      (campAudience === "SPECIFIC_USER" || campAudience === "SPECIFIC_INSTALLATION") &&
      !campTargetId.trim()
    ) {
      toast.warn("Target ID is required for specific audience.");
      return;
    }

    if (campAudience === "ALL_ENABLED" && !editingCampaignId) {
      setIsConfirmCampaignOpen(true);
      return;
    }

    await executeSaveCampaign();
  };

  const executeSaveCampaign = async () => {
    setIsSavingCampaign(true);
    try {
      const payload: Partial<NotificationCampaignItem> = {
        name: campName.trim(),
        type: campType,
        title: campTitle.trim(),
        body: campBody.trim(),
        targetType: campAudience,
        targetUserIds:
          campAudience === "SPECIFIC_USER" && campTargetId.trim() ? [campTargetId.trim()] : [],
        targetInstallationIds:
          campAudience === "SPECIFIC_INSTALLATION" && campTargetId.trim()
            ? [campTargetId.trim()]
            : [],
        deepLink: campDeepLink.trim() || "/",
        schedule: {
          timezone: campTimezone,
          startAt: new Date(`${campStartDate}T${campTimeOfDay}:00`).toISOString(),
          endAt: campEndDate ? new Date(`${campEndDate}T23:59:59`).toISOString() : null,
          recurrence:
            campType === "RECURRING"
              ? {
                  frequency: campFrequency,
                  interval: 1,
                  daysOfWeek: campFrequency === "WEEKLY" ? campDaysOfWeek : [],
                  dayOfMonth: campFrequency === "MONTHLY" ? campDayOfMonth : 1,
                  timeOfDay: campTimeOfDay,
                }
              : undefined,
        },
      };

      if (editingCampaignId) {
        await adminService.updateCampaign(editingCampaignId, payload);
        toast.success("Campaign updated successfully!");
      } else {
        await adminService.createCampaign(payload);
        toast.success("Campaign scheduled successfully!");
      }

      setIsConfirmCampaignOpen(false);
      setIsCampaignModalOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || "Failed to save campaign");
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await adminService.pauseCampaign(id);
      toast.info("Campaign paused");
      fetchCampaigns(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to pause");
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await adminService.resumeCampaign(id);
      toast.success("Campaign resumed!");
      fetchCampaigns(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to resume");
    }
  };

  const handleCancelCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this campaign? Cancelled campaigns will never execute.")) {
      return;
    }
    try {
      await adminService.cancelCampaign(id);
      toast.warn("Campaign cancelled");
      fetchCampaigns(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Archive this campaign? Historical runs will be preserved for audit.")) {
      return;
    }
    try {
      await adminService.archiveCampaign(id);
      toast.success("Campaign archived");
      fetchCampaigns(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleViewRuns = async (camp: NotificationCampaignItem) => {
    try {
      const res = await adminService.getCampaignRuns(camp._id);
      setSelectedCampaignRuns({ campaign: camp, runs: res.runs });
    } catch (err: any) {
      toast.error(err.message || "Failed to load runs");
    }
  };

  // --- TEMPLATE ACTIONS ---
  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null);
    setTmplName("");
    setTmplCategory("GAME");
    setTmplTitle("👑 Royal Battle Awaits!");
    setTmplBody("Gather your friends and start a Royal Battle tonight.");
    setTmplDeepLink("/");
    setIsTemplateModalOpen(true);
  };

  const handleEditTemplate = (tmpl: NotificationTemplateItem) => {
    setEditingTemplateId(tmpl._id);
    setTmplName(tmpl.name);
    setTmplCategory(tmpl.category);
    setTmplTitle(tmpl.title);
    setTmplBody(tmpl.body);
    setTmplDeepLink(tmpl.deepLink || "/");
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim() || !tmplTitle.trim() || !tmplBody.trim()) {
      toast.warn("Template name, title, and body are required.");
      return;
    }

    setIsSavingTemplate(true);
    try {
      const payload: Partial<NotificationTemplateItem> = {
        name: tmplName.trim(),
        category: tmplCategory,
        title: tmplTitle.trim(),
        body: tmplBody.trim(),
        deepLink: tmplDeepLink.trim() || "/",
      };

      if (editingTemplateId) {
        await adminService.updateTemplate(editingTemplateId, payload);
        toast.success("Template updated!");
      } else {
        await adminService.createTemplate(payload);
        toast.success("Template created!");
      }

      setIsTemplateModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleDuplicateTemplate = async (id: string) => {
    try {
      await adminService.duplicateTemplate(id);
      toast.success("Template duplicated!");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await adminService.deleteTemplate(id);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete template");
    }
  };

  const handleUseTemplate = (tmpl: NotificationTemplateItem) => {
    setEditingCampaignId(null);
    setCampName(tmpl.name);
    setCampTitle(tmpl.title);
    setCampBody(tmpl.body);
    setCampDeepLink(tmpl.deepLink || "/");
    setCampType("ONE_TIME");
    setCampAudience("ALL_ENABLED");
    setCampTimezone("Asia/Kolkata");
    setCampStartDate(new Date().toISOString().split("T")[0]);
    setCampTimeOfDay("20:00");
    setActiveSubTab("campaigns");
    setIsCampaignModalOpen(true);
    toast.info(`Populated campaign form from template: "${tmpl.name}"`);
  };

  const toggleWeekday = (day: number) => {
    setCampDaysOfWeek((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day].sort()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tab Navigation */}
      <div className="bg-gradient-to-r from-[#21073F]/90 via-[#190833]/95 to-[#21073F]/90 border border-[#FFD700]/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#782287] via-[#AC41D7] to-[#F9C933] p-0.5 shadow-[0_0_15px_rgba(249,201,51,0.3)] flex items-center justify-center">
              <div className="w-full h-full bg-[#080320] rounded-[10px] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#FBE278]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-wide">Push Notifications</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700]/30 to-[#AC41D7]/30 text-[#FBE278] border border-[#FFD700]/40 font-bold uppercase tracking-wider">
                  Phase 3 Live
                </span>
              </div>
              <p className="text-xs text-white/60">
                Automatic game events, precision audience targeting, analytics & CTR, recurring campaigns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchData(true);
                fetchCampaigns(true);
                fetchTemplates(true);
                if (activeSubTab === "automatic") fetchAutoEvents(true);
                if (activeSubTab === "analytics") fetchAnalytics(analyticsRange, true);
                if (activeSubTab === "audience") handleEstimateAudience();
              }}
              disabled={loading || campaignLoading || templateLoading || autoEventsLoading || analyticsLoading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
              title="Refresh all data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading || campaignLoading || autoEventsLoading || analyticsLoading ? "animate-spin" : ""
                }`}
              />
            </button>

            {activeSubTab === "overview" && (
              <button
                onClick={handleOpenSend}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.35)] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>+ Send Now</span>
              </button>
            )}

            {activeSubTab === "campaigns" && (
              <button
                onClick={handleOpenCreateCampaign}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.35)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Campaign</span>
              </button>
            )}

            {activeSubTab === "templates" && (
              <button
                onClick={handleOpenCreateTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.35)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Template</span>
              </button>
            )}

            {activeSubTab === "analytics" && (
              <button
                onClick={handleExportCsv}
                disabled={isExportingCsv}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#36D978] via-[#2ECC71] to-[#1ABC9C] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(46,204,113,0.35)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingCsv ? "Exporting..." : "Export CSV"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "overview"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Overview & Send Now</span>
          </button>

          <button
            onClick={() => setActiveSubTab("automatic")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "automatic"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Automatic Events ({autoEvents.length || 5})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("audience")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "audience"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Target className="w-4 h-4 text-cyan-400" />
            <span>Audience Builder</span>
          </button>

          <button
            onClick={() => setActiveSubTab("campaigns")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "campaigns"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Campaigns ({campaigns.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "templates"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Templates ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === "analytics"
                ? "bg-[#FFD700] text-black shadow-[0_0_12px_rgba(255,215,0,0.4)]"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Analytics & CTR</span>
          </button>
        </div>
      </div>

      {/* Backend Firebase Status Warning if credentials pending */}
      {data && !data.metrics.isFirebaseConfigured && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Firebase Admin credentials pending in .env</p>
            <p className="text-amber-200/80 mt-0.5 leading-relaxed">
              Add <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_PROJECT_ID</code>,{" "}
              <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_CLIENT_EMAIL</code>, and{" "}
              <code className="bg-black/30 px-1 py-0.5 rounded text-amber-300">FIREBASE_PRIVATE_KEY</code> to enable live delivery to devices.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: OVERVIEW & SEND NOW (Phase 1) */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
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
                <span className="text-xs font-semibold uppercase tracking-wider">Active Campaigns</span>
                <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
                  <Repeat className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {campaignStats.activeRecurring + campaignStats.scheduledOneTime}
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                {campaignStats.activeRecurring} recurring · {campaignStats.scheduledOneTime} scheduled
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between text-white/60 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Guest Devices</span>
                <div className="p-2 rounded-lg bg-cyan-400/10 text-cyan-400">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {data?.metrics.guestInstallations.toLocaleString() || 0}
              </div>
              <p className="text-[11px] text-white/50 mt-1">Unassociated visitor devices</p>
            </div>
          </div>

          {/* Recent Direct / Broadcast Logs */}
          <div className="bg-[#190833]/80 border border-[#FFD700]/20 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFD700]" />
                Recent Direct Dispatches (Send Now)
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
        </div>
      )}

      {/* SUB-TAB 2: CAMPAIGNS (Phase 2) */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-6">
          {/* Campaign Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#190833]/80 border border-white/10">
              <span className="text-[11px] text-white/50 uppercase font-semibold">Total Campaigns</span>
              <div className="text-xl font-bold text-white mt-0.5">{campaignStats.totalCampaigns}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#190833]/80 border border-white/10">
              <span className="text-[11px] text-[#36D978] uppercase font-semibold">Active Recurring</span>
              <div className="text-xl font-bold text-[#36D978] mt-0.5">{campaignStats.activeRecurring}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#190833]/80 border border-white/10">
              <span className="text-[11px] text-[#FBE278] uppercase font-semibold">Scheduled One-Time</span>
              <div className="text-xl font-bold text-[#FBE278] mt-0.5">{campaignStats.scheduledOneTime}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#190833]/80 border border-white/10">
              <span className="text-[11px] text-cyan-400 uppercase font-semibold">Completed Runs</span>
              <div className="text-xl font-bold text-cyan-400 mt-0.5">{campaignStats.totalRuns}</div>
            </div>
          </div>

          {/* Campaigns List Table */}
          <div className="bg-[#190833]/80 border border-[#FFD700]/20 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FFD700]" />
                Automated Notification Campaigns
              </h3>
              <span className="text-xs text-white/50">{campaigns.length} campaigns</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-black/30 text-white/60 text-[11px] uppercase tracking-wider border-b border-white/5">
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Type & Recurrence</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4">Next Run</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {campaigns.length > 0 ? (
                    campaigns.map((camp) => (
                      <tr key={camp._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{camp.name}</span>
                          </div>
                          <div className="text-xs text-white/60 truncate max-w-xs">{camp.title}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                camp.type === "RECURRING"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {camp.type}
                            </span>
                            <span className="text-xs text-white/70">
                              {camp.type === "RECURRING"
                                ? `${camp.schedule.recurrence?.frequency} at ${camp.schedule.recurrence?.timeOfDay}`
                                : new Date(camp.schedule.startAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/40">{camp.schedule.timezone}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs">
                            {camp.targetType === "ALL_ENABLED"
                              ? "All Enabled Players"
                              : camp.targetType === "REGISTERED_USERS"
                              ? "Registered Users Only"
                              : camp.targetType === "SPECIFIC_USER"
                              ? "Specific User"
                              : "Specific Device"}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-xs">
                          {camp.nextRunAt ? (
                            <div>
                              <div className="font-medium text-[#FBE278]">
                                {new Date(camp.nextRunAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {" "}
                                {new Date(camp.nextRunAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              <div className="text-[10px] text-white/40">
                                Total runs: {camp.runCount || 0}
                              </div>
                            </div>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              camp.status === "ACTIVE"
                                ? "bg-[#36D978]/20 text-[#36D978] border-[#36D978]/40"
                                : camp.status === "SCHEDULED"
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                                : camp.status === "PAUSED"
                                ? "bg-white/10 text-white/60 border-white/20"
                                : camp.status === "COMPLETED"
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                : "bg-red-500/20 text-red-400 border-red-500/40"
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {camp.status === "ACTIVE" && camp.type === "RECURRING" && (
                              <button
                                onClick={() => handlePauseCampaign(camp._id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                title="Pause Campaign"
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {camp.status === "PAUSED" && camp.type === "RECURRING" && (
                              <button
                                onClick={() => handleResumeCampaign(camp._id)}
                                className="p-1.5 rounded-lg bg-[#36D978]/20 hover:bg-[#36D978]/30 text-[#36D978] transition-colors"
                                title="Resume Campaign"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {["ACTIVE", "SCHEDULED", "PAUSED"].includes(camp.status) && (
                              <button
                                onClick={() => handleCancelCampaign(camp._id)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                                title="Cancel Campaign"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleViewRuns(camp)}
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                              title="View Run History"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleEditCampaign(camp)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                              title="Edit Campaign"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteCampaign(camp._id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Archive Campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40 text-xs">
                        {campaignLoading ? (
                          "Loading campaigns..."
                        ) : (
                          <div className="space-y-2">
                            <Calendar className="w-8 h-8 text-white/20 mx-auto" />
                            <p>No campaigns scheduled yet.</p>
                            <button
                              onClick={handleOpenCreateCampaign}
                              className="px-3.5 py-1.5 rounded-lg bg-[#FFD700] text-black font-bold text-xs"
                            >
                              + Create First Campaign
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUTOMATIC GAME-EVENT NOTIFICATIONS (Phase 3) */}
      {activeSubTab === "automatic" && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#21073F] via-[#2F1054] to-[#21073F] border border-[#FFD700]/30 flex items-start gap-3 shadow-lg">
            <Zap className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-white/80 leading-relaxed">
              <p className="font-bold text-white mb-0.5">Automated Game-Event Decision Engine</p>
              Notifications are triggered directly by gameplay actions. If a player is currently online on Socket.IO,
              they receive an in-app prompt. If offline or in the background, they receive an FCM push notification,
              automatically filtered by quiet hours, category preferences, and event cooldowns.
            </div>
          </div>

          {/* Automatic Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoEvents.map((cfg) => (
              <div
                key={cfg._id || cfg.eventType}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xl ${
                  cfg.enabled
                    ? "bg-[#190833]/90 border-[#FFD700]/30 hover:border-[#FFD700]/60"
                    : "bg-[#100422]/60 border-white/10 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFD700]/20 text-[#FBE278] border border-[#FFD700]/40">
                        {cfg.category}
                      </span>
                      <span className="text-[11px] text-white/50 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" /> {cfg.cooldownMinutes}m cooldown
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleAutoEventQuick(cfg)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        cfg.enabled
                          ? "bg-[#36D978]/20 text-[#36D978] border border-[#36D978]/40 hover:bg-[#36D978]/30"
                          : "bg-white/10 text-white/50 border border-white/15 hover:bg-white/15"
                      }`}
                    >
                      {cfg.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{cfg.displayName}</span>
                    <span className="text-[10px] font-mono text-white/40 font-normal">({cfg.eventType})</span>
                  </h3>
                  {cfg.description && <p className="text-xs text-white/60 mt-1">{cfg.description}</p>}

                  {/* Template Preview Card */}
                  <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-left">
                    <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wider">
                      <span>Message Template</span>
                      <span>Link: {cfg.deepLinkTemplate || "/"}</span>
                    </div>
                    <p className="text-xs font-bold text-[#FBE278] truncate">{cfg.titleTemplate}</p>
                    <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{cfg.bodyTemplate}</p>
                  </div>

                  {/* Variables */}
                  {cfg.availableVariables && cfg.availableVariables.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-white/40 mr-1">Variables:</span>
                      {cfg.availableVariables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-[#FBE278]/90"
                        >
                          {"{{" + v + "}}"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-end">
                  <button
                    onClick={() => handleEditAutoEvent(cfg)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(255,215,0,0.3)] cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Template & Limits</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AUDIENCE BUILDER & REACH ESTIMATOR (Phase 3) */}
      {activeSubTab === "audience" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Filter Form Card */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#190833]/90 border border-[#FFD700]/30 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <Target className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="text-base font-bold text-white">Audience Segmentation Builder</h3>
                </div>
                <span className="text-[11px] text-cyan-300 font-mono">Live Sync</span>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">
                Define criteria to segment player targets. The calculator evaluates live MongoDB player stats, FCM
                installation registrations, user quiet hours, and daily rate limits.
              </p>

              <div className="space-y-4">
                {/* Level Range */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">Player Level Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        min={1}
                        placeholder="Min Level (e.g. 5)"
                        value={audLevelMin}
                        onChange={(e) => setAudLevelMin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#FFD700]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        placeholder="Max Level (e.g. 50)"
                        value={audLevelMax}
                        onChange={(e) => setAudLevelMax(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#FFD700]"
                      />
                    </div>
                  </div>
                </div>

                {/* Game Mode Affinity */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">Game Mode Affinity</label>
                  <select
                    value={audGameMode}
                    onChange={(e) => setAudGameMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#21073F] border border-white/10 text-white text-xs focus:border-[#FFD700]"
                  >
                    <option value="ALL">All Game Modes (Any Active Player)</option>
                    <option value="classic">Classic Mode Players</option>
                    <option value="detective">Detective Mode Players</option>
                    <option value="modern">Modern Mode Players</option>
                  </select>
                </div>

                {/* Recency Inactivity */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1.5">
                    Activity Window (Days Since Last Match)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 7 (played within last 7 days)"
                    value={audLastPlayedDays}
                    onChange={(e) => setAudLastPlayedDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:border-[#FFD700]"
                  />
                </div>

                {/* Push Only Toggle */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="onlyPushCheck"
                    checked={audOnlyPushEnabled}
                    onChange={(e) => setAudOnlyPushEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FFD700] bg-white/5 border-white/20 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="onlyPushCheck" className="text-xs text-white/80 select-none cursor-pointer">
                    Only include users with active FCM push notifications enabled
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={handleEstimateAudience}
                  disabled={isEstimatingAudience}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEstimatingAudience ? "animate-spin" : ""}`} />
                  <span>{isEstimatingAudience ? "Calculating..." : "Recalculate Reach"}</span>
                </button>

                <button
                  onClick={handleApplyAudienceToCampaign}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(255,215,0,0.35)] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply to Campaign</span>
                </button>
              </div>
            </div>

            {/* Live Reach Projection Card */}
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#240845] via-[#1D0638] to-[#120426] border border-[#FFD700]/40 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FFD700]">
                    Projected Reach Estimate
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#36D978]/20 text-[#36D978] border border-[#36D978]/30">
                    Real-time
                  </span>
                </div>

                {/* Big Number */}
                <div className="text-center py-4 bg-black/30 rounded-2xl border border-white/5">
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#36D978] via-[#2ECC71] to-[#FBE278]">
                    {audEstimate?.estimatedDeliveryCount ?? 0}
                  </span>
                  <p className="text-xs text-white/60 mt-1 font-semibold uppercase tracking-wider">
                    Eligible Deliveries Ready
                  </p>
                </div>

                {/* Exclusion & funnel breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/70">Total Registered User Accounts</span>
                    <span className="font-bold text-white">{audEstimate?.totalUsers ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/70">Matching Player Stats Filters</span>
                    <span className="font-bold text-[#FBE278]">{audEstimate?.matchingStatsUsers ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/70">Active FCM Devices Found</span>
                    <span className="font-bold text-white">{audEstimate?.eligibleInstallations ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                    <span>Suppressed: User Opted Out of Category</span>
                    <span className="font-bold">-{audEstimate?.optedOutCount ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <span>Suppressed: Active Quiet Hours</span>
                    <span className="font-bold">-{audEstimate?.inQuietHoursCount ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    <span>Suppressed: Daily Rate Limit / Cooldown</span>
                    <span className="font-bold">-{audEstimate?.rateLimitedCount ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: ANALYTICS & CTR (Phase 3) */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-white/50 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Window:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7days", label: "Last 7 Days" },
                { id: "last30days", label: "Last 30 Days" },
                { id: "thisMonth", label: "This Month" },
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => {
                    setAnalyticsRange(w.id);
                    fetchAnalytics(w.id, true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    analyticsRange === w.id
                      ? "bg-[#FFD700] text-black shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAnalytics(analyticsRange, true)}
                disabled={analyticsLoading}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${analyticsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">Total Sent</div>
              <div className="text-3xl font-black text-white">{analyticsData?.metrics.totalSent ?? 0}</div>
              <p className="text-[11px] text-white/40 mt-1">Dispatched to devices</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-[#36D978]/30 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#36D978] mb-1">Delivered</div>
              <div className="text-3xl font-black text-[#36D978]">{analyticsData?.metrics.totalDelivered ?? 0}</div>
              <p className="text-[11px] text-[#36D978]/80 mt-1">
                {analyticsData?.metrics.deliveryRate ?? 100}% delivery rate
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-cyan-400/30 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">Opened / Viewed</div>
              <div className="text-3xl font-black text-cyan-300">{analyticsData?.metrics.totalOpened ?? 0}</div>
              <p className="text-[11px] text-cyan-400/80 mt-1">{analyticsData?.metrics.openRate ?? 0}% open rate</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-purple-400/30 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
                Click-Through (CTR)
              </div>
              <div className="text-3xl font-black text-purple-300">{analyticsData?.metrics.ctr ?? 0}%</div>
              <p className="text-[11px] text-purple-400/80 mt-1">
                {analyticsData?.metrics.totalClicked ?? 0} deep-link actions
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#190833]/80 border border-red-500/20 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">Failed</div>
              <div className="text-3xl font-black text-red-400">{analyticsData?.metrics.totalFailed ?? 0}</div>
              <p className="text-[11px] text-red-400/60 mt-1">Invalid or stale tokens</p>
            </div>
          </div>

          {/* Performance Breakdown: Campaigns & Automatic Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns */}
            <div className="p-5 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FFD700]" />
                  <span>Top Campaigns Performance</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-black/30 text-white/50 text-[10px] uppercase tracking-wider border-b border-white/5">
                      <th className="py-2 px-3">Campaign</th>
                      <th className="py-2 px-3">Sent</th>
                      <th className="py-2 px-3">Opened</th>
                      <th className="py-2 px-3">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {analyticsData?.topCampaigns && analyticsData.topCampaigns.length > 0 ? (
                      analyticsData.topCampaigns.map((c) => (
                        <tr key={c.campaignId} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white truncate block max-w-[160px]">{c.name}</span>
                            <span className="text-[10px] text-white/40">{c.type}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{c.sent}</td>
                          <td className="py-2.5 px-3 font-mono text-[#36D978]">{c.opened}</td>
                          <td className="py-2.5 px-3 font-mono text-[#FBE278]">{c.ctr}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-white/40 text-xs">
                          No campaign performance recorded in this window.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Automatic Event Categories */}
            <div className="p-5 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFD700]" />
                  <span>Automatic Event Categories</span>
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-black/30 text-white/50 text-[10px] uppercase tracking-wider border-b border-white/5">
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Sent</th>
                      <th className="py-2 px-3">Opened</th>
                      <th className="py-2 px-3">Open Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {analyticsData?.topEventTypes && analyticsData.topEventTypes.length > 0 ? (
                      analyticsData.topEventTypes.map((ev) => (
                        <tr key={ev.category} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 font-semibold text-white">{ev.category}</td>
                          <td className="py-2.5 px-3 font-mono">{ev.sent}</td>
                          <td className="py-2.5 px-3 font-mono text-[#36D978]">{ev.opened}</td>
                          <td className="py-2.5 px-3 font-mono text-cyan-300">{ev.openRate}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-white/40 text-xs">
                          No automatic event activity recorded in this window.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSubTab === "templates" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl._id}
                className="p-4 rounded-2xl bg-[#190833]/80 border border-[#FFD700]/20 hover:border-[#FFD700]/50 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {tmpl.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateTemplate(tmpl._id)}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditTemplate(tmpl)}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                        title="Edit Template"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(tmpl._id)}
                        className="p-1 text-red-400/60 hover:text-red-400 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm tracking-wide">{tmpl.name}</h4>
                  <p className="text-xs font-semibold text-[#FBE278] mt-1">{tmpl.title}</p>
                  <p className="text-xs text-white/70 mt-1 line-clamp-3 leading-relaxed">{tmpl.body}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-white/40 truncate">Link: {tmpl.deepLink || "/"}</span>
                  <button
                    onClick={() => handleUseTemplate(tmpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFD700]/20 hover:bg-[#FFD700]/30 border border-[#FFD700]/40 text-[#FBE278] font-bold text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Use Template</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODAL 1: SEND NOW (PHASE 1) --- */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/40 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#FFD700]" />
                Send Instant Push Notification
              </h3>
              <button
                onClick={() => setIsSendModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrepareSendSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Notification Title</span>
                  <span className={`${sendTitle.length > 100 ? "text-amber-400" : "text-white/40"}`}>
                    {sendTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Message Body</span>
                  <span className={`${sendMessage.length > 400 ? "text-amber-400" : "text-white/40"}`}>
                    {sendMessage.length}/500
                  </span>
                </div>
                <textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[#FFD700] text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Target Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSendTargetType("ALL")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      sendTargetType === "ALL"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    All Enabled ({data?.metrics.enabledInstallations || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTargetType("INSTALLATION")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      sendTargetType === "INSTALLATION"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Specific Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTargetType("USER")}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold ${
                      sendTargetType === "USER"
                        ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Specific User
                  </button>
                </div>
              </div>

              {sendTargetType !== "ALL" && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    {sendTargetType === "INSTALLATION" ? "Installation ID" : "User ObjectId"}
                  </label>
                  <input
                    type="text"
                    value={sendTargetId}
                    onChange={(e) => setSendTargetId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Internal Route (Deep Link)</label>
                <input
                  type="text"
                  value={sendDeepLink}
                  onChange={(e) => setSendDeepLink(e.target.value)}
                  placeholder="/"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              {/* Live Phone Preview Card */}
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
                  <h4 className="text-sm font-bold text-white">{sendTitle || "Notification Title"}</h4>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                    {sendMessage || "Notification message content..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CONFIRM BROADCAST (PHASE 1) --- */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#21073F] border border-[#FFD700]/60 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Broadcast Notification?</h3>
            </div>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              This will send immediately to approximately{" "}
              <strong className="text-[#FFD700]">{data?.metrics.enabledInstallations || 0}</strong> active
              installations.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSendNow}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95"
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

      {/* --- MODAL 3: CAMPAIGN BUILDER (PHASE 2) --- */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/50 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FFD700]" />
                {editingCampaignId ? "Edit Campaign" : "Create Notification Campaign"}
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4">
              {/* Campaign Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/70 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    required
                    placeholder="e.g. Weekend Royal Battle Reminder"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Schedule Type</label>
                  <select
                    value={campType}
                    onChange={(e) => setCampType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#21073F] border border-white/10 text-white text-sm"
                  >
                    <option value="ONE_TIME">Schedule Once</option>
                    <option value="RECURRING">Recurring</option>
                  </select>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Notification Title</span>
                  <span className={`${campTitle.length > 100 ? "text-amber-400" : "text-white/40"}`}>
                    {campTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  maxLength={120}
                  required
                  placeholder="👑 Your Kingdom Awaits!"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Notification Message</span>
                  <span className={`${campBody.length > 400 ? "text-amber-400" : "text-white/40"}`}>
                    {campBody.length}/500
                  </span>
                </div>
                <textarea
                  value={campBody}
                  onChange={(e) => setCampBody(e.target.value)}
                  maxLength={500}
                  rows={2}
                  required
                  placeholder="Gather your friends and start a Royal Battle tonight."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm resize-none"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Target Audience</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "ALL_ENABLED", label: "All Enabled" },
                    { id: "REGISTERED_USERS", label: "Registered Users" },
                    { id: "SPECIFIC_USER", label: "Specific User" },
                    { id: "SPECIFIC_INSTALLATION", label: "Specific Device" },
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      type="button"
                      onClick={() => setCampAudience(aud.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold ${
                        campAudience === aud.id
                          ? "bg-[#FFD700]/20 border-[#FFD700] text-[#FBE278]"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </div>

              {(campAudience === "SPECIFIC_USER" || campAudience === "SPECIFIC_INSTALLATION") && (
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    {campAudience === "SPECIFIC_USER" ? "Target User ObjectId" : "Target Installation ID"}
                  </label>
                  <input
                    type="text"
                    value={campTargetId}
                    onChange={(e) => setCampTargetId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                  />
                </div>
              )}

              {/* Schedule Details */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3.5">
                <span className="block text-xs font-bold text-[#FBE278] uppercase tracking-wider">
                  Scheduling & Timezone
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1">Timezone</label>
                    <select
                      value={campTimezone}
                      onChange={(e) => setCampTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#21073F] border border-white/10 text-white text-xs"
                    >
                      {SUPPORTED_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1">Time of Day (24h)</label>
                    <input
                      type="time"
                      value={campTimeOfDay}
                      onChange={(e) => setCampTimeOfDay(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl bg-[#21073F] border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/60 mb-1">
                      {campType === "ONE_TIME" ? "Execution Date" : "Start Date"}
                    </label>
                    <input
                      type="date"
                      value={campStartDate}
                      onChange={(e) => setCampStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 rounded-xl bg-[#21073F] border border-white/10 text-white text-xs"
                    />
                  </div>

                  {campType === "RECURRING" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-white/60 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={campEndDate}
                        onChange={(e) => setCampEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-[#21073F] border border-white/10 text-white text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Recurrence Rule */}
                {campType === "RECURRING" && (
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-white/70">Frequency:</label>
                      <div className="flex items-center gap-2">
                        {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setCampFrequency(freq)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              campFrequency === freq
                                ? "bg-[#FFD700] text-black"
                                : "bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {campFrequency === "WEEKLY" && (
                      <div>
                        <label className="block text-[11px] text-white/60 mb-1.5">Repeat on days:</label>
                        <div className="flex items-center gap-1.5">
                          {WEEKDAYS.map((wd) => (
                            <button
                              key={wd.day}
                              type="button"
                              onClick={() => toggleWeekday(wd.day)}
                              className={`w-9 h-8 rounded-lg text-xs font-bold ${
                                campDaysOfWeek.includes(wd.day)
                                  ? "bg-[#FFD700] text-black shadow-md"
                                  : "bg-white/5 text-white/60 hover:bg-white/10"
                              }`}
                            >
                              {wd.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {campFrequency === "MONTHLY" && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-white/70">Day of month (1-31):</label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={campDayOfMonth}
                          onChange={(e) => setCampDayOfMonth(parseInt(e.target.value, 10) || 1)}
                          className="w-20 px-2.5 py-1 rounded-lg bg-[#21073F] border border-white/10 text-white text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
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
                  <h4 className="text-sm font-bold text-white">{campTitle || "Notification Title"}</h4>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-2">
                    {campBody || "Notification message content..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCampaign}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] cursor-pointer"
                >
                  {isSavingCampaign ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingCampaignId ? "Save Changes" : "Schedule Campaign"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: CONFIRM CAMPAIGN ACTIVATION --- */}
      {isConfirmCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#21073F] border border-[#FFD700]/60 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FFD700]">
              <Sparkles className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Activate Campaign?</h3>
            </div>
            <div className="space-y-1 text-xs sm:text-sm text-white/80">
              <p>
                Audience: <strong className="text-[#FFD700]">{data?.metrics.enabledInstallations || 0} active installations</strong>
              </p>
              <p>
                Schedule: <strong className="text-white">{campType === "RECURRING" ? `${campFrequency} at ${campTimeOfDay}` : `${campStartDate} at ${campTimeOfDay}`}</strong>
              </p>
              <p>
                Timezone: <strong className="text-white">{campTimezone}</strong>
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmCampaignOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSaveCampaign}
                disabled={isSavingCampaign}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] cursor-pointer"
              >
                {isSavingCampaign ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: TEMPLATE BUILDER --- */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/50 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFD700]" />
                {editingTemplateId ? "Edit Template" : "New Notification Template"}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Template Name</label>
                <input
                  type="text"
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                  required
                  placeholder="e.g. ⚔️ Weekend Royal Battle"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Category</label>
                <select
                  value={tmplCategory}
                  onChange={(e) => setTmplCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#21073F] border border-white/10 text-white text-sm"
                >
                  <option value="GAME">GAME</option>
                  <option value="EVENT">EVENT</option>
                  <option value="REMINDER">REMINDER</option>
                  <option value="REWARD">REWARD</option>
                  <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Notification Title</label>
                <input
                  type="text"
                  value={tmplTitle}
                  onChange={(e) => setTmplTitle(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Notification Body</label>
                <textarea
                  value={tmplBody}
                  onChange={(e) => setTmplBody(e.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Deep Link</label>
                <input
                  type="text"
                  value={tmplDeepLink}
                  onChange={(e) => setTmplDeepLink(e.target.value)}
                  placeholder="/"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTemplate}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs sm:text-sm hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] cursor-pointer"
                >
                  {isSavingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 6: EXECUTION RUNS HISTORY --- */}
      {selectedCampaignRuns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/50 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-[#FFD700]" />
                  Execution History
                </h3>
                <p className="text-xs text-white/60">{selectedCampaignRuns.campaign.name}</p>
              </div>
              <button
                onClick={() => setSelectedCampaignRuns(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-black/40 text-white/60 text-[11px] uppercase tracking-wider border-b border-white/5">
                    <th className="py-2.5 px-3">Run Date / Time</th>
                    <th className="py-2.5 px-3">Targeted</th>
                    <th className="py-2.5 px-3">Delivered</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {selectedCampaignRuns.runs.length > 0 ? (
                    selectedCampaignRuns.runs.map((r) => (
                      <tr key={r._id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-xs">
                          {new Date(r.scheduledAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-xs">{r.targetCount}</td>
                        <td className="py-2.5 px-3 text-xs">
                          <span className="text-[#36D978] font-bold">{r.successCount}</span>
                          {r.failureCount > 0 && (
                            <span className="text-red-400 ml-1">({r.failureCount} failed)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              r.status === "SENT"
                                ? "bg-[#36D978]/20 text-[#36D978] border border-[#36D978]/30"
                                : r.status === "PARTIAL"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-white/40 text-xs">
                        No executions recorded yet for this campaign.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedCampaignRuns(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 7: EDIT AUTOMATIC EVENT (PHASE 3) --- */}
      {isAutoEventModalOpen && editingAutoEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-gradient-to-b from-[#21073F] to-[#120426] border border-[#FFD700]/50 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#FFD700]" />
                  <span>Configure: {editingAutoEvent.displayName}</span>
                </h3>
                <p className="text-xs text-white/50 font-mono mt-0.5">{editingAutoEvent.eventType}</p>
              </div>
              <button
                onClick={() => setIsAutoEventModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAutoEventSubmit} className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="text-xs font-bold text-white block">Event Trigger Enabled</span>
                  <span className="text-[11px] text-white/50">
                    When active, dispatches in-app or push alerts automatically
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoEventEnabled}
                  onChange={(e) => setAutoEventEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-[#FFD700] bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">
                  Cooldown Period (Minutes per User)
                </label>
                <input
                  type="number"
                  min={0}
                  value={autoEventCooldown}
                  onChange={(e) => setAutoEventCooldown(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#FFD700]"
                />
                <p className="text-[11px] text-white/40 mt-1">
                  Prevents spamming the same recipient more than once every {autoEventCooldown} minutes.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Title Template</span>
                  <span className="text-white/40">{autoEventTitle.length}/120</span>
                </div>
                <input
                  type="text"
                  value={autoEventTitle}
                  onChange={(e) => setAutoEventTitle(e.target.value)}
                  maxLength={120}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#FFD700]"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-white/70 mb-1">
                  <span>Body Template</span>
                  <span className="text-white/40">{autoEventBody.length}/500</span>
                </div>
                <textarea
                  value={autoEventBody}
                  onChange={(e) => setAutoEventBody(e.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#FFD700] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Deep Link Route</label>
                <input
                  type="text"
                  value={autoEventDeepLink}
                  onChange={(e) => setAutoEventDeepLink(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#FFD700]"
                />
              </div>

              {/* Supported Variables Pills */}
              {editingAutoEvent.availableVariables && editingAutoEvent.availableVariables.length > 0 && (
                <div>
                  <span className="block text-[11px] font-semibold text-white/60 mb-1.5">
                    Click to copy variable:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {editingAutoEvent.availableVariables.map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => {
                          navigator.clipboard.writeText(`{{${v}}}`);
                          toast.info(`Copied {{${v}}}`);
                        }}
                        className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-[#FBE278] transition-colors cursor-pointer"
                      >
                        {"{{" + v + "}}"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div>
                <span className="block text-xs font-semibold text-white/70 mb-1.5">Sample Preview</span>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#2B0952] to-[#1D0638] border border-[#FFD700]/40 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                    <span className="text-[#FBE278] font-bold">👑 Raja Rani Police Thief</span>
                    <span>· now</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{autoEventTitle || "Notification Title"}</h4>
                  <p className="text-xs text-white/80 leading-relaxed">{autoEventBody || "Message body..."}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAutoEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAutoEvent}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD700] via-[#FBE278] to-[#E59866] text-black font-bold text-xs hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(255,215,0,0.4)] cursor-pointer"
                >
                  {isSavingAutoEvent ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
