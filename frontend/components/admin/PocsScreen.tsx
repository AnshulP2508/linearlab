"use client";

import { PaginatedResponse, PocDetail, PocListItem } from "@/types/admin";
import { DeveloperPocDetail } from "@/types/developer";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ActionButton, Drawer, EmptyState, MaterialIcon, SearchPill, SurfaceCard, Toast } from "./primitives";
import { useRemoteData } from "./useRemoteData";
import { useCategories } from "./usePocs";
import { CategoryDropdown } from "./CategoryDropdown";
import { RequestPocModal } from "./RequestPocModal";

type GenerationSection = "purpose" | "problemItSolves" | "howToUseIt";
type EditableSection = "purpose" | "problem" | "usage" | "tech" | "team" | "reference" | "links";
type ApiErrorBody =
  | { message?: string | string[]; error?: string | { message?: string | string[] } }
  | null
  | undefined;

function extractApiErrorMessage(body: ApiErrorBody, fallback: string) {
  const nestedError = typeof body?.error === "object" && body.error ? body.error.message : undefined;
  const message = nestedError ?? body?.message ?? (typeof body?.error === "string" ? body.error : undefined);
  if (Array.isArray(message)) return message[0] ?? fallback;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildDemoUrlsPayload(urls: { liveDemoUrl: string; githubRepositoryUrl: string; videoLinkUrl: string }) {
  const liveDemoUrl = normalizeOptionalUrl(urls.liveDemoUrl);
  const githubRepositoryUrl = normalizeOptionalUrl(urls.githubRepositoryUrl);
  const videoLinkUrl = normalizeOptionalUrl(urls.videoLinkUrl);
  return {
    ...(liveDemoUrl ? { liveDemoUrl } : {}),
    ...(githubRepositoryUrl ? { githubRepositoryUrl } : {}),
    ...(videoLinkUrl ? { videoLinkUrl } : {}),
  };
}

function formatFileSize(value?: number | null) {
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function buildDownloadHref(file: { mimeType?: string | null; contentBase64?: string | null }) {
  if (!file.contentBase64) return null;
  return `data:${file.mimeType ?? "application/octet-stream"};base64,${file.contentBase64}`;
}

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read file"));
        return;
      }
      const [, base64 = ""] = result.split(",", 2);
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
const initialPocs: PaginatedResponse<PocListItem> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

const statusStyles: Record<string, string> = {
  PENDING_REVIEW: "bg-amber-500/10 text-amber-700",
  PUBLISHED: "bg-emerald-500/10 text-emerald-700",
  REJECTED: "bg-rose-500/10 text-rose-700",
  DRAFT: "bg-slate-200 text-slate-600",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const feedbackTypeLabel: Record<string, string> = {
  USER_FEEDBACK: "User Feedback",
  ADMIN_COMMENT: "Admin Comment",
  BUG_REPORT: "Bug Report",
  IMPROVEMENT_SUGGESTION: "Improvement Suggestion",
};

export function PocsScreen({ mode = "admin" }: { mode?: "admin" | "developer" }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PocDetail | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<PocListItem | null>(null);
  const [developersList, setDevelopersList] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [adminFeedbackComment, setAdminFeedbackComment] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [developerDetail, setDeveloperDetail] = useState<DeveloperPocDetail | null>(null);
  const [purpose, setPurpose] = useState("");
  const [problemItSolves, setProblemItSolves] = useState("");
  const [howToUseIt, setHowToUseIt] = useState("");
  const [techStack, setTechStack] = useState("");
  const [teamBehindIt, setTeamBehindIt] = useState("");
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState("");
  const [videoLinkUrl, setVideoLinkUrl] = useState("");
  const [referenceMaterials, setReferenceMaterials] = useState<File[]>([]);
  const [lockedSections, setLockedSections] = useState<Record<string, boolean>>({});
  const [generatingSection, setGeneratingSection] = useState<GenerationSection | null>(null);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(""); // "" = All
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [headerPortal, setHeaderPortal] = useState<HTMLElement | null>(null);

  // Categories
  const { categories, refresh: refreshCategories } = useCategories();

  // POC totals (summary cards remain unchanged by search)
  const { data: totalData, setData: setTotalData } = useRemoteData<PaginatedResponse<PocListItem>>(
    "/api/pocs",
    initialPocs,
  );

  // POC list for the table (filtered by search)
  const { data, setData, loading } = useRemoteData<PaginatedResponse<PocListItem>>(
    `/api/pocs?search=${encodeURIComponent(search)}`,
    initialPocs,
  );

  const refreshPocs = useCallback(async () => {
    const response = await fetch(`/api/pocs?search=${encodeURIComponent(search)}`, { cache: "no-store" });
    if (response.ok) {
      const body = (await response.json()) as PaginatedResponse<PocListItem>;
      setData(body);
    }
  }, [search, setData]);

  useEffect(() => {
    setHeaderPortal(document.getElementById("header-actions"));
  }, []);

  function buildInitialLockedSections(detail: DeveloperPocDetail | null) {
    return {
      purpose: Boolean(detail?.developerWorkspace.documentationDraft?.purpose?.trim()),
      problem: Boolean(detail?.developerWorkspace.documentationDraft?.problemItSolves?.trim()),
      usage: Boolean(detail?.developerWorkspace.documentationDraft?.howToUseIt?.trim()),
      tech: Boolean(detail?.developerWorkspace.documentationDraft?.techStack?.trim()),
      team: Boolean(detail?.developerWorkspace.documentationDraft?.teamBehindIt?.trim()),
      reference: Boolean(detail?.developerWorkspace.uploadedFiles.length),
      links: Boolean(
        detail?.developerWorkspace.demoUrls.liveDemoUrl?.trim() ||
        detail?.developerWorkspace.demoUrls.githubRepositoryUrl?.trim() ||
        detail?.developerWorkspace.demoUrls.videoLinkUrl?.trim(),
      ),
    };
  }

  async function openPoc(id: string) {
    const response = await fetch(`/api/pocs/${id}`);
    const body = (await response.json()) as PocDetail;
    setSelected(body);
    if (mode === "developer") {
      const developerResponse = await fetch(`/api/developer/pocs/${id}`, { cache: "no-store" });
      const developerBody = (await developerResponse.json()) as DeveloperPocDetail & {
        message?: string | string[];
        error?: string | { message?: string | string[] };
      };
      if (!developerResponse.ok) {
        setToast(extractApiErrorMessage(developerBody, "Failed to load developer workspace"));
        setTimeout(() => setToast(null), 2500);
        return;
      }
      setDeveloperDetail(developerBody);
      setPurpose(developerBody.developerWorkspace.documentationDraft?.purpose ?? "");
      setProblemItSolves(developerBody.developerWorkspace.documentationDraft?.problemItSolves ?? "");
      setHowToUseIt(developerBody.developerWorkspace.documentationDraft?.howToUseIt ?? "");
      setTechStack(developerBody.developerWorkspace.documentationDraft?.techStack ?? "");
      setTeamBehindIt(developerBody.developerWorkspace.documentationDraft?.teamBehindIt ?? "");
      setLiveDemoUrl(developerBody.developerWorkspace.demoUrls.liveDemoUrl ?? "");
      setGithubRepositoryUrl(developerBody.developerWorkspace.demoUrls.githubRepositoryUrl ?? "");
      setVideoLinkUrl(developerBody.developerWorkspace.demoUrls.videoLinkUrl ?? "");
      setReferenceMaterials([]);
      setLockedSections(buildInitialLockedSections(developerBody));
    }
  }

  async function submitAdminFeedback() {
    if (!selected || !adminFeedbackComment.trim()) return;

    setFeedbackSubmitting(true);
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pocId: selected.id,
          comment: adminFeedbackComment.trim(),
        }),
      });

      if (!response.ok) {
        setToast("Failed to send feedback");
        setTimeout(() => setToast(null), 2500);
        return;
      }

      setAdminFeedbackComment("");
      await openPoc(selected.id);
      setToast("Feedback sent to developer");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  async function runAction(id: string, action: "approve" | "archive" | "reject" | "pending" | "delete") {
    const response = await fetch(
      action === "delete" ? `/api/pocs/${id}` : `/api/pocs/${id}/${action}`,
      {
        method: action === "delete" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body:
          action === "reject"
            ? JSON.stringify({ reason: "Needs review updates and documentation fixes." })
            : action === "pending"
              ? JSON.stringify({ notes: "Kept in pending review." })
              : undefined,
      },
    );
    if (!response.ok) return;

    if (action === "delete") {
      setData({ ...data, items: data.items.filter((item) => item.id !== id) });
      setTotalData({
        ...totalData,
        items: totalData.items.filter((item) => item.id !== id),
        total: Math.max(0, totalData.total - 1),
      });
      setSelected(null);
    } else {
      const refreshed = await fetch(`/api/pocs/${id}`);
      const poc = (await refreshed.json()) as PocDetail;
      setSelected(poc);
      setData({
        ...data,
        items: data.items.map((item) => (item.id === id ? poc : item)),
      });
      setTotalData({
        ...totalData,
        items: totalData.items.map((item) => (item.id === id ? poc : item)),
      });
    }

    setToast(`POC ${action}d successfully`);
    setTimeout(() => setToast(null), 2500);
  }

  async function openAssignModal(poc: PocListItem) {
    setAssignTarget(poc);
    setAssignEmail("");
    setAssignError(null);
    setDevelopersList([]);
    try {
      const res = await fetch(`/api/developers?pageSize=100`, { cache: 'no-store' });
      if (res.ok) {
        const body = (await res.json()) as { items: Array<{ id: string; name: string; email?: string }> };
        // body is PaginatedResponse<DeveloperListItem>
        setDevelopersList(body.items.map((d) => ({ id: d.id, name: d.name, email: d.email })));
      } else {
        console.error('Failed to load developers:', res.status);
      }
    } catch (err) {
      console.error('Failed to load developers:', err);
    }
  }

  async function assignDeveloperByEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = assignEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setAssignError("Enter a valid developer email address");
      return;
    }

    const developer = developersList.find(
      (item) => item.email?.trim().toLowerCase() === email,
    );

    if (!developer) {
      setAssignError("No active developer found with this email");
      return;
    }

    await assignDeveloper(assignTarget!.id, developer.id);
  }

  async function assignDeveloper(pocId: string, developerId: string) {
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/pocs/${pocId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerId }),
      });
      if (!response.ok) {
        setToast('Failed to assign developer');
        setTimeout(() => setToast(null), 2500);
        return;
      }

      const updated = await response.json();
      setData({ ...data, items: data.items.map((item) => (item.id === pocId ? updated : item)) });
      setTotalData({ ...totalData, items: totalData.items.map((item) => (item.id === pocId ? updated : item)) });
      setAssignTarget(null);
      setToast('Developer assigned');
      setTimeout(() => setToast(null), 2500);
    } finally {
      setAssignLoading(false);
    }
  }

  async function refreshDeveloperDetail(pocId: string) {
    const response = await fetch(`/api/developer/pocs/${pocId}`, { cache: "no-store" });
    const body = (await response.json()) as DeveloperPocDetail & {
      message?: string | string[];
      error?: string | { message?: string | string[] };
    };
    if (!response.ok) {
      throw new Error(extractApiErrorMessage(body, "Failed to refresh POC"));
    }
    setDeveloperDetail(body);
    setLockedSections(buildInitialLockedSections(body));
    return body;
  }

  async function updateDeveloperWorkspace(
    pocId: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setWorkspaceSaving(true);
    try {
      const response = await fetch(`/api/developer/pocs/${pocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as DeveloperPocDetail & {
        message?: string | string[];
        error?: string | { message?: string | string[] };
      };
      if (!response.ok) {
        throw new Error(extractApiErrorMessage(body, "Failed to update POC"));
      }
      setDeveloperDetail(body);
      setLockedSections(buildInitialLockedSections(body));
      setToast(successMessage);
      setTimeout(() => setToast(null), 2500);
      return body;
    } finally {
      setWorkspaceSaving(false);
    }
  }

  async function generateDocumentationSection(section: GenerationSection) {
    if (!selected) return;
    const prompt =
      section === "purpose" ? purpose.trim() :
      section === "problemItSolves" ? problemItSolves.trim() :
      howToUseIt.trim();

    if (!prompt) {
      setToast("Enter a prompt before generating");
      setTimeout(() => setToast(null), 2500);
      return;
    }

    setGeneratingSection(section);
    try {
      const response = await fetch(`/api/pocs/${selected.id}/documentation/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, prompt }),
      });
      const body = (await response.json()) as {
        content?: string;
        message?: string | string[];
        error?: string | { message?: string | string[] };
      };
      if (!response.ok) {
        throw new Error(extractApiErrorMessage(body, "Failed to generate content"));
      }
      const content = body.content?.trim() ?? "";
      if (!content) throw new Error("The model returned an empty response");

      if (section === "purpose") setPurpose(content);
      if (section === "problemItSolves") setProblemItSolves(content);
      if (section === "howToUseIt") setHowToUseIt(content);

      await updateDeveloperWorkspace(
        selected.id,
        {
          documentationDraft: {
            ...(section === "purpose" ? { purpose: content } : {}),
            ...(section === "problemItSolves" ? { problemItSolves: content } : {}),
            ...(section === "howToUseIt" ? { howToUseIt: content } : {}),
          },
        },
        "Content generated successfully",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to generate content");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setGeneratingSection(null);
    }
  }

  async function saveDeveloperSection(section: EditableSection) {
    if (!selected) return;
    try {
      const payload: Record<string, unknown> = {};
      if (["purpose", "problem", "usage", "tech", "team"].includes(section)) {
        payload.documentationDraft = {
          ...(section === "purpose" ? { purpose } : {}),
          ...(section === "problem" ? { problemItSolves } : {}),
          ...(section === "usage" ? { howToUseIt } : {}),
          ...(section === "tech" ? { techStack } : {}),
          ...(section === "team" ? { teamBehindIt } : {}),
        };
      }
      if (section === "links") {
        payload.demoUrls = buildDemoUrlsPayload({ liveDemoUrl, githubRepositoryUrl, videoLinkUrl });
      }
      if (section === "reference" && referenceMaterials.length > 0) {
        payload.addFiles = await Promise.all(
          referenceMaterials.map(async (file) => ({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            contentBase64: await fileToBase64(file),
            sizeBytes: file.size,
          })),
        );
      }
      await updateDeveloperWorkspace(selected.id, payload, "Section saved");
      if (section === "reference") setReferenceMaterials([]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to save section");
      setTimeout(() => setToast(null), 2500);
    }
  }

  async function removeUploadedReference(fileId: string) {
    if (!selected) return;
    try {
      await updateDeveloperWorkspace(selected.id, { deleteFileId: fileId }, "Document removed");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to remove document");
      setTimeout(() => setToast(null), 2500);
    }
  }

  const statusOptions = [
    { value: "ALL", label: "All" },
    { value: "PUBLISHED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PENDING_REVIEW", label: "Pending" },
  ];

  // Client-side filter
  const filteredItems = data.items.filter((item) => {
    const statusOk = statusFilter === "ALL" || item.status === statusFilter;
    const categoryOk = categoryFilter === "" || item.categoryId === categoryFilter;
    return statusOk && categoryOk;
  });

  const isAdminMode = mode === "admin";
  const selectedDocumentation =
    selected?.developerWorkspace?.documentationDraft?.purpose?.trim() ||
    selected?.developerWorkspace?.documentationDraft?.problemItSolves?.trim() ||
    selected?.developerWorkspace?.documentationDraft?.howToUseIt?.trim() ||
    selected?.documentation ||
    "Technical documentation attached for review.";
  const documentationSections = [
    {
      key: "purpose",
      title: "Purpose",
      content: selected?.developerWorkspace?.documentationDraft?.purpose?.trim() ?? "",
    },
    {
      key: "problem",
      title: "Problem It Solves",
      content:
        selected?.developerWorkspace?.documentationDraft?.problemItSolves?.trim() ?? "",
    },
    {
      key: "usage",
      title: "How To Use It",
      content: selected?.developerWorkspace?.documentationDraft?.howToUseIt?.trim() ?? "",
    },
    {
      key: "tech",
      title: "Tech Stack",
      content: selected?.developerWorkspace?.documentationDraft?.techStack?.trim() ?? "",
    },
    {
      key: "team",
      title: "Team Behind It",
      content: selected?.developerWorkspace?.documentationDraft?.teamBehindIt?.trim() ?? "",
    },
  ].filter((section) => Boolean(section.content));
  const detailLinks = [
    ["Live Demo", selected?.developerWorkspace?.demoUrls?.liveDemoUrl ?? selected?.demoUrl ?? ""],
    ["GitHub", selected?.developerWorkspace?.demoUrls?.githubRepositoryUrl ?? ""],
    ["Video Link", selected?.developerWorkspace?.demoUrls?.videoLinkUrl ?? ""],
  ].filter(([, value]) => Boolean(value));
  const uploadedDocuments = selected?.developerWorkspace?.uploadedFiles ?? [];

  const headerActions = (
    <div className="flex items-center gap-2">
      {/* Status filter */}
      <div className="relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[14px] transition hover:bg-surface-container-low"
          onClick={() => setStatusDropdownOpen((open) => !open)}
          aria-expanded={statusDropdownOpen}
        >
          <MaterialIcon className="text-[18px]">filter_list</MaterialIcon>
          Status: {statusOptions.find((option) => option.value === statusFilter)?.label ?? "All"}
          <span className="text-on-surface-variant">▾</span>
        </button>

        {statusDropdownOpen ? (
          <div className="absolute left-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-lg">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`block w-full text-left px-3 py-2 text-[14px] transition hover:bg-surface-container-low ${statusFilter === option.value ? "bg-surface-container-low text-primary" : "text-on-surface"
                  }`}
                onClick={() => {
                  setStatusFilter(option.value);
                  setStatusDropdownOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Category filter */}
      <CategoryDropdown
        categories={categories}
        value={categoryFilter}
        onChange={setCategoryFilter}
        open={categoryDropdownOpen}
        onToggle={() => setCategoryDropdownOpen((o) => !o)}
        onClose={() => setCategoryDropdownOpen(false)}
      />

      <ActionButton onClick={() => setShowRequestModal(true)} id="request-poc-btn">
        <MaterialIcon>add</MaterialIcon>
        New POC
      </ActionButton>
    </div>
  );  

  return (
    <div className="space-y-6">
      {headerPortal ? createPortal(headerActions, headerPortal) : headerActions}

      {isAdminMode ? (
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
          <SurfaceCard className="flex h-32 flex-col justify-between p-6">
            <div className="flex items-start justify-between">
              <span className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Total Active</span>
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <MaterialIcon>rocket_launch</MaterialIcon>
              </div>
            </div>
            <div className="text-[34px] font-semibold">{totalData.items.filter((item) => item.status === "PUBLISHED").length}</div>
          </SurfaceCard>
          <SurfaceCard className="flex h-32 flex-col justify-between p-6">
            <div className="flex items-start justify-between">
              <span className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Pending Review</span>
              <div className="rounded-lg bg-yellow-500/10 p-2 text-amber-600">
                <MaterialIcon>pending_actions</MaterialIcon>
              </div>
            </div>
            <div className="text-[34px] font-semibold">{totalData.items.filter((item) => item.status === "PENDING_REVIEW").length}</div>
          </SurfaceCard>
          <SurfaceCard className="flex h-32 flex-col justify-between p-6">
            <div className="flex items-start justify-between">
              <span className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Approved Today</span>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                <MaterialIcon>check_circle</MaterialIcon>
              </div>
            </div>
            <div className="text-[34px] font-semibold">{totalData.items.filter((item) => item.status === "PUBLISHED").length}</div>
          </SurfaceCard>
          <SurfaceCard className="flex h-32 flex-col justify-between p-6">
            <div className="flex items-start justify-between">
              <span className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">Success Rate</span>
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600">
                <MaterialIcon>trending_up</MaterialIcon>
              </div>
            </div>
            <div className="text-[34px] font-semibold">
              {totalData.total ? `${Math.round((totalData.items.filter((item) => item.status === "PUBLISHED").length / totalData.total) * 100)}%` : "0%"}
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      <SurfaceCard className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <SearchPill
            value={search}
            onChange={setSearch}
            placeholder="Search POCs, developers, or tags..."
            className="w-full max-w-md"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low">
                {["POC Name", "Developer", "Category", "Status", "Rating", "Actions"].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-on-surface-variant">
                    Loading POCs…
                  </td>
                </tr>
              ) : !loading && data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState
                      title="No POCs found"
                      description="Your summary counts stay the same. Try another search term or clear the filter to see POC results."
                    />
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[14px] text-on-surface-variant">
                    No POCs match the current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((poc, index) => {
                  const iconConfig = [
                    ["analytics", "bg-primary/5 text-primary"],
                    ["payments", "bg-emerald-500/5 text-emerald-600"],
                    ["cloud_off", "bg-rose-500/5 text-rose-600"],
                  ][index % 3];
                  return (
                    <tr key={poc.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconConfig[1]}`}>
                            <MaterialIcon>{iconConfig[0]}</MaterialIcon>
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-on-surface">{poc.title}</div>
                            <div className="text-[14px] text-on-surface-variant">{poc.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px]">
                        {isAdminMode ? (
                          poc.developer ? (
                            <div className="flex items-center justify-between group">
                              <span>{poc.developer.name}</span>
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-primary hover:bg-primary-container/10"
                                onClick={() => openAssignModal(poc)}
                                title="Change developer"
                              >
                                <MaterialIcon className="text-[16px]">edit</MaterialIcon>
                              </button>
                            </div>
                          ) : (
                            <button
                              className="rounded-lg border border-primary bg-primary/5 px-3 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary-container/20"
                              onClick={() => openAssignModal(poc)}
                            >
                              <MaterialIcon className="inline text-[14px] mr-1">person_add</MaterialIcon>
                              Assign
                            </button>
                          )
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span>{poc.developer?.name ?? "Unassigned"}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-surface-variant px-2 py-1 text-[12px] text-on-secondary-container">
                          {poc.category?.name ?? "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold uppercase ${statusStyles[poc.status] ?? "bg-slate-100 text-slate-700"}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {poc.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-on-surface-variant">
                        {poc.ratingAverage ? poc.ratingAverage.toFixed(1) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="rounded-lg p-2 text-primary transition-all hover:bg-primary-container/10"
                          onClick={() => openPoc(poc.id)}
                        >
                          <MaterialIcon>visibility</MaterialIcon>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <Drawer
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          setDeveloperDetail(null);
          setAdminFeedbackComment("");
        }}
        title="POC Detail View"
        actions={
          isAdminMode && selected ? (
            <ActionButton
              variant="secondary"
              className="px-3 py-2"
              onClick={() => runAction(selected.id, "pending")}
            >
              <MaterialIcon>pending_actions</MaterialIcon>
              Keep Pending
            </ActionButton>
          ) : null
        }
      >
        {selected ? (
          <div>
            <div className="mb-8">
              <div className="mb-2 flex items-start justify-between">
                <h1 className="text-[32px] font-semibold text-on-surface">{selected.title}</h1>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-amber-700">
                  {selected.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="flex gap-4 text-[14px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <MaterialIcon className="text-[18px]">calendar_today</MaterialIcon>
                  {new Date(selected.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MaterialIcon className="text-[18px]">terminal</MaterialIcon>
                  {selected.technologies.join(", ")}
                </span>
              </div>
            </div>

            <div className="mb-10">
              <h4 className="mb-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Review Lifecycle
              </h4>
              <div className="relative flex justify-between">
                <div className="absolute left-0 top-4 -z-10 h-[2px] w-full bg-slate-100" />
                <div className="absolute left-0 top-4 -z-10 h-[2px] w-2/3 bg-primary" />
                {[
                  { label: "Uploaded", active: true, icon: "check" },
                  { label: "Review", active: true, icon: "check" },
                  { label: "Approved", active: selected.status === "PUBLISHED", icon: "lock" },
                  { label: "Live", active: selected.status === "PUBLISHED", icon: "rocket_launch" },
                ].map((step) => (
                  <div key={step.label} className="flex flex-col items-center gap-2">
                    <div
                      className={
                        step.active
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                          : "flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-slate-400"
                      }
                    >
                      <MaterialIcon className="text-[18px]" filled={step.active}>
                        {step.icon}
                      </MaterialIcon>
                    </div>
                    <span className={step.active ? "text-[12px] font-bold text-primary" : "text-[12px] text-on-surface-variant"}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Demo Preview
              </h4>
              <div className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-outline-variant bg-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#154f7a,transparent_35%),linear-gradient(135deg,#08131f,#12304a,#08131f)] opacity-95" />
                <div className="absolute inset-6 rounded-lg border border-cyan-500/20">
                  <div className="grid h-full grid-cols-3 gap-4 p-4">
                    <div className="space-y-3">
                      <div className="h-12 rounded bg-cyan-400/10" />
                      <div className="h-24 rounded bg-cyan-400/10" />
                      <div className="h-16 rounded bg-cyan-400/10" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-36 rounded bg-cyan-400/10" />
                      <div className="h-16 rounded bg-cyan-400/10" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-20 rounded bg-cyan-400/10" />
                      <div className="h-20 rounded bg-cyan-400/10" />
                      <div className="h-20 rounded bg-cyan-400/10" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                    <MaterialIcon className="text-[40px] text-white" filled>
                      play_arrow
                    </MaterialIcon>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Demo Links
              </h4>
              {!isAdminMode && developerDetail ? (
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <ActionButton
                      variant="ghost"
                      className="px-3 py-2 text-[13px]"
                      onClick={() => setLockedSections((current) => ({ ...current, links: false }))}
                      disabled={!lockedSections.links}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      className="px-3 py-2 text-[13px]"
                      onClick={() => void saveDeveloperSection("links")}
                      disabled={Boolean(lockedSections.links) || workspaceSaving}
                    >
                      Done
                    </ActionButton>
                  </div>
                  <div className="grid gap-4">
                    {[
                      ["Live Demo", liveDemoUrl, setLiveDemoUrl, "https://demo.example.com"],
                      ["GitHub", githubRepositoryUrl, setGithubRepositoryUrl, "https://github.com/org/repo"],
                      ["Video Link", videoLinkUrl, setVideoLinkUrl, "https://youtube.com/watch?v=..."],
                    ].map(([label, value, setter, placeholder]) => (
                      <div key={label as string} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                          {label as string}
                        </p>
                        {lockedSections.links ? (
                          value ? (
                            <a
                              href={normalizeOptionalUrl(value as string)}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block break-all text-[15px] font-medium text-primary"
                            >
                              {normalizeOptionalUrl(value as string)}
                            </a>
                          ) : (
                            <p className="mt-3 text-[15px] text-on-surface-variant">No link added yet.</p>
                          )
                        ) : (
                          <input
                            type="url"
                            value={value as string}
                            onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                            placeholder={placeholder as string}
                            className="mt-3 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : detailLinks.length > 0 ? (
                <div className="grid gap-4">
                  {detailLinks.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                    >
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                        {label}
                      </p>
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block break-all text-[15px] font-medium text-primary"
                      >
                        {value}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-[16px] leading-relaxed text-on-surface">
                  No demo links have been added yet.
                </p>
              )}
            </div>

            <div className="mb-10">
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Documentation
              </h4>
              {!isAdminMode && developerDetail ? (
                <div className="grid gap-4">
                  {[
                    ["purpose", "Purpose", purpose, setPurpose, true],
                    ["problem", "Problem It Solves", problemItSolves, setProblemItSolves, true],
                    ["usage", "How To Use It", howToUseIt, setHowToUseIt, true],
                    ["tech", "Tech Stack", techStack, setTechStack, false],
                    ["team", "Team Behind It", teamBehindIt, setTeamBehindIt, false],
                  ].map(([key, title, value, setter, canGenerate]) => (
                    <div
                      key={key as string}
                      className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                          {title as string}
                        </p>
                        <div className="flex gap-2">
                          {canGenerate ? (
                            <ActionButton
                              variant="secondary"
                              className="px-3 py-2 text-[13px]"
                              onClick={() =>
                                void generateDocumentationSection(
                                  key === "purpose"
                                    ? "purpose"
                                    : key === "problem"
                                    ? "problemItSolves"
                                    : "howToUseIt",
                                )
                              }
                              disabled={generatingSection !== null || workspaceSaving || lockedSections[key as EditableSection]}
                            >
                              {generatingSection === (key === "purpose" ? "purpose" : key === "problem" ? "problemItSolves" : "howToUseIt")
                                ? "Generating..."
                                : "Generate"}
                            </ActionButton>
                          ) : null}
                          <ActionButton
                            variant="ghost"
                            className="px-3 py-2 text-[13px]"
                            onClick={() => setLockedSections((current) => ({ ...current, [key as string]: false }))}
                            disabled={!lockedSections[key as EditableSection]}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            className="px-3 py-2 text-[13px]"
                            onClick={() => void saveDeveloperSection(key as EditableSection)}
                            disabled={Boolean(lockedSections[key as EditableSection]) || workspaceSaving}
                          >
                            Done
                          </ActionButton>
                        </div>
                      </div>
                      {lockedSections[key as EditableSection] ? (
                        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-on-surface">
                          {(value as string).trim() || "No content added yet."}
                        </p>
                      ) : (
                        <textarea
                          value={value as string}
                          onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                          rows={key === "tech" || key === "team" ? 5 : 7}
                          placeholder={canGenerate ? "Enter a raw prompt or edit generated content" : "Add content"}
                          className="mt-3 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] leading-6 outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : documentationSections.length > 0 ? (
                <div className="grid gap-4">
                  {documentationSections.map((section) => (
                    <div
                      key={section.key}
                      className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                    >
                      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                        {section.title}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-7 text-on-surface">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-[16px] leading-relaxed text-on-surface">
                  {selectedDocumentation}
                </p>
              )}
            </div>

            <div className="mb-10">
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Uploaded Documents
              </h4>
              {!isAdminMode && developerDetail ? (
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <ActionButton
                      variant="ghost"
                      className="px-3 py-2 text-[13px]"
                      onClick={() => setLockedSections((current) => ({ ...current, reference: false }))}
                      disabled={!lockedSections.reference}
                    >
                      Edit
                    </ActionButton>
                    <ActionButton
                      className="px-3 py-2 text-[13px]"
                      onClick={() => void saveDeveloperSection("reference")}
                      disabled={Boolean(lockedSections.reference) || workspaceSaving}
                    >
                      Done
                    </ActionButton>
                  </div>
                  {!lockedSections.reference ? (
                    <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-[14px] text-on-surface-variant">
                      <MaterialIcon>upload_file</MaterialIcon>
                      <span>Add reference files</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? []);
                          setReferenceMaterials((current) => [...current, ...files]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  ) : null}
                  {referenceMaterials.length > 0 ? (
                    <div className="grid gap-3">
                      {referenceMaterials.map((file) => (
                        <div key={file.name} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[15px] font-semibold text-on-surface">{file.name}</p>
                              <p className="mt-1 text-[13px] text-on-surface-variant">Ready to upload</p>
                            </div>
                            <button
                              type="button"
                              className="rounded-full p-1 text-on-surface-variant hover:text-rose-600"
                              onClick={() =>
                                setReferenceMaterials((current) => current.filter((item) => item.name !== file.name))
                              }
                            >
                              <MaterialIcon className="text-[18px]">close</MaterialIcon>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {developerDetail.developerWorkspace.uploadedFiles.length > 0 ? (
                    <div className="grid gap-4">
                      {developerDetail.developerWorkspace.uploadedFiles.map((file) => (
                        <div key={file.id} className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[15px] font-semibold text-on-surface">{file.name}</p>
                              <p className="mt-2 text-[13px] text-on-surface-variant">
                                {file.type.toUpperCase()} {formatFileSize(file.sizeBytes) ? `• ${formatFileSize(file.sizeBytes)}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {buildDownloadHref(file) ? (
                                <a
                                  href={buildDownloadHref(file) ?? undefined}
                                  download={file.name}
                                  className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] font-semibold text-primary"
                                >
                                  Download
                                </a>
                              ) : null}
                              {!lockedSections.reference ? (
                                <button
                                  type="button"
                                  className="rounded-full p-1 text-on-surface-variant hover:text-rose-600"
                                  onClick={() => void removeUploadedReference(file.id)}
                                >
                                  <MaterialIcon className="text-[18px]">close</MaterialIcon>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : uploadedDocuments.length > 0 ? (
                <div className="grid gap-4">
                  {uploadedDocuments.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[15px] font-semibold text-on-surface">{file.name}</p>
                          <p className="mt-2 text-[13px] text-on-surface-variant">
                            {file.type.toUpperCase()} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {file.contentBase64 ? (
                          <a
                            href={`data:${file.mimeType ?? "application/octet-stream"};base64,${file.contentBase64}`}
                            download={file.name}
                            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] font-semibold text-primary"
                          >
                            Download
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-[16px] leading-relaxed text-on-surface">
                  No documents have been uploaded yet.
                </p>
              )}
            </div>



            {isAdminMode ? (
              <div className="mb-10">
                <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                  Developer Feedback
                </h4>
                <p className="mb-4 text-[14px] text-on-surface-variant">
                  Comments you submit here appear on the developer&apos;s Feedback Review page for this POC.
                </p>

                {selected.feedback.length > 0 ? (
                  <div className="mb-6 space-y-3">
                    {selected.feedback.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">
                            {item.type && feedbackTypeLabel[item.type]
                              ? feedbackTypeLabel[item.type]
                              : "Feedback"}
                          </p>
                          <p className="text-[12px] text-on-surface-variant">
                            {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="mt-2 text-[14px] font-medium text-on-surface">
                          {item.user.name}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-on-surface">
                          {item.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-6 text-[14px] text-on-surface-variant">
                    No feedback has been shared for this POC yet.
                  </p>
                )}

                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <label
                    htmlFor="admin-poc-feedback"
                    className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant"
                  >
                    Add feedback for developer
                  </label>
                  <textarea
                    id="admin-poc-feedback"
                    value={adminFeedbackComment}
                    onChange={(event) => setAdminFeedbackComment(event.target.value)}
                    rows={4}
                    placeholder="Share review notes, requested changes, or approval guidance..."
                    className="w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-2 text-[14px] text-on-surface outline-none focus:border-primary"
                  />
                  <div className="mt-3 flex justify-end">
                    <ActionButton
                      onClick={() => void submitAdminFeedback()}
                      disabled={feedbackSubmitting || !adminFeedbackComment.trim()}
                    >
                      <MaterialIcon>chat</MaterialIcon>
                      {feedbackSubmitting ? "Sending..." : "Send Feedback"}
                    </ActionButton>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mb-10 rounded-xl border border-outline-variant bg-surface-container-low p-6">
              <h4 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Developer Information
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-[14px] font-bold text-on-primary-container">
                  {(selected.developer?.name ?? "D")
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-[14px] font-bold">{selected.developer?.name}</div>
                  <div className="text-[14px] text-on-surface-variant">
                    {selected.developer?.email}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-outline-variant bg-white py-2 text-[14px] font-bold text-on-surface-variant transition-colors hover:bg-slate-50">
                  View Profile
                </button>
                <button className="flex-1 rounded-lg border border-outline-variant bg-white py-2 text-[14px] font-bold text-on-surface-variant transition-colors hover:bg-slate-50">
                  Contact
                </button>
              </div>
            </div>

            {isAdminMode ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ActionButton variant="danger" className="py-3" onClick={() => runAction(selected.id, "reject")}>
                  <MaterialIcon>close</MaterialIcon>
                  Reject POC
                </ActionButton>
                <ActionButton className="py-3" onClick={() => runAction(selected.id, "approve")}>
                  <MaterialIcon filled>check</MaterialIcon>
                  Approve POC
                </ActionButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      {/* Request New POC Modal */}
      <RequestPocModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        categories={categories}
        onSuccess={async () => {
          await Promise.all([refreshPocs(), refreshCategories()]);
          setToast("POC request submitted successfully!");
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {/* Assign Developer Modal */}
      {isAdminMode && assignTarget ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div
            className="w-full bg-surface sm:rounded-xl sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-outline-variant px-6 py-4">
              <h3 className="text-[18px] font-semibold text-on-surface">
                Assign Developer
              </h3>
              <p className="mt-1 text-[12px] text-on-surface-variant">
                {assignTarget.title}
              </p>
            </div>
            <form onSubmit={assignDeveloperByEmail}>
              <div className="p-6">
                <label className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                  Developer Email
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-[14px] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    assignError ? "border-rose-400 focus:ring-rose-200" : "border-outline-variant"
                  }`}
                  placeholder="developer@example.com"
                  value={assignEmail}
                  onChange={(event) => {
                    setAssignEmail(event.target.value);
                    setAssignError(null);
                  }}
                  disabled={assignLoading}
                />
                {assignError ? (
                  <p className="mt-2 text-[12px] text-rose-600">{assignError}</p>
                ) : (
                  <p className="mt-2 text-[12px] text-on-surface-variant">
                    Enter the exact active developer email address.
                  </p>
                )}
              </div>
              <div className="flex gap-2 border-t border-outline-variant px-6 py-4 sm:justify-end">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-outline-variant bg-white px-4 py-2 text-[14px] font-semibold text-on-surface transition-colors hover:bg-surface-container-low sm:flex-none"
                  onClick={() => setAssignTarget(null)}
                  disabled={assignLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-[14px] font-semibold text-on-primary transition-opacity hover:opacity-95 disabled:opacity-60 sm:flex-none"
                  disabled={assignLoading}
                >
                  {assignLoading ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
