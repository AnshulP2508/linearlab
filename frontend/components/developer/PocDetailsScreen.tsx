"use client";

import Link from "next/link";
import {
  ActionButton,
  MaterialIcon,
  SurfaceCard,
} from "@/components/admin/primitives";
import { PocDetail } from "@/types/admin";
import { DeveloperPocDetail } from "@/types/developer";
import { useEffect, useRef, useState } from "react";
import { useDeveloperWorkspace } from "./DeveloperWorkspaceContext";
import { DeveloperPriorityBadge } from "./DeveloperPriorityBadge";
import { DeveloperStatusBadge } from "./DeveloperStatusBadge";
import { StepProgress } from "./StepProgress";
import {
  developerStageLabel,
  developerStageOrder,
  formatDate,
} from "./developerUtils";

type GenerationSection = "purpose" | "problemItSolves" | "howToUseIt";

type ApiErrorBody =
  | {
      message?: string | string[];
      error?: string | { message?: string | string[] };
    }
  | null
  | undefined;

function extractApiErrorMessage(body: ApiErrorBody, fallback: string) {
  const nestedError = typeof body?.error === "object" && body.error ? body.error.message : undefined;
  const message = nestedError ?? body?.message ?? (typeof body?.error === "string" ? body.error : undefined);

  if (Array.isArray(message)) {
    return message[0] ?? fallback;
  }

  return typeof message === "string" && message.trim() ? message : fallback;
}

function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function buildDemoUrlsPayload(urls: {
  liveDemoUrl: string;
  githubRepositoryUrl: string;
  videoLinkUrl: string;
}) {
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

function buildDownloadHref(file: {
  mimeType?: string | null;
  contentBase64?: string | null;
}) {
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

export function PocDetailsScreen({ pocId }: { pocId: string }) {
  const { getPocDetail, updatePoc, setToast } = useDeveloperWorkspace();
  const [detail, setDetail] = useState<DeveloperPocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readOnlyFallback, setReadOnlyFallback] = useState(false);

  // Documentation editing state
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
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);

  function normalizeFileName(name: string) {
    return name.trim().toLowerCase();
  }

  function isDuplicateReferenceFile(file: File) {
    const normalizedName = normalizeFileName(file.name);
    return (
      detail?.developerWorkspace.uploadedFiles.some(
        (uploadedFile) => normalizeFileName(uploadedFile.name) === normalizedName,
      ) ?? false
    );
  }

  function isDuplicatePendingReferenceFile(file: File) {
    const normalizedName = normalizeFileName(file.name);
    return referenceMaterials.some(
      (pendingFile) => normalizeFileName(pendingFile.name) === normalizedName,
    );
  }

  function handleReferenceMaterialChange(files: FileList | null, input: HTMLInputElement) {
    if (!files || files.length === 0 || lockedSections.reference) {
      return;
    }
    const nextFiles = Array.from(files);
    const duplicateUploaded = nextFiles.find((file) => isDuplicateReferenceFile(file));
    if (duplicateUploaded) {
      setToast({
        message: `"${duplicateUploaded.name}" has already been uploaded for this POC`,
        tone: "danger",
      });
      input.value = "";
      return;
    }
    const duplicatePending = nextFiles.find((file) => isDuplicatePendingReferenceFile(file));
    if (duplicatePending) {
      setToast({
        message: `"${duplicatePending.name}" is already selected`,
        tone: "danger",
      });
      input.value = "";
      return;
    }
    setReferenceMaterials((current) => [...current, ...nextFiles]);
    input.value = "";
  }

  function mapAdminPocToDeveloperDetail(poc: PocDetail): DeveloperPocDetail {
    const stage =
      poc.status === "PUBLISHED"
        ? "PUBLISHED"
        : poc.status === "PENDING_REVIEW"
          ? "UNDER_ADMIN_REVIEW"
          : poc.status === "REJECTED"
            ? "DEVELOPMENT_COMPLETED"
            : "ASSIGNED";
    const uploadedFiles = poc.developerWorkspace?.uploadedFiles ?? [];
    const supportDocuments =
      uploadedFiles.length > 0
        ? uploadedFiles.map((file) => file.name)
        : poc.documentation
          ? [poc.documentation]
          : ["Briefing document.pdf"];

    return {
      id: poc.id,
      title: poc.title,
      slug: poc.slug,
      assignedBy: poc.developer?.name ?? "Admin Control",
      assignedDate: poc.createdAt,
      deadline: poc.submittedAt ?? poc.updatedAt ?? poc.createdAt,
      priority: "MEDIUM",
      stage,
      summary: poc.summary,
      description: poc.description,
      technologies: poc.technologies ?? [],
      documentationCount: uploadedFiles.length || (poc.documentation ? 1 : 0),
      demoUrls: {
        liveDemoUrl: poc.demoUrl ?? null,
      },
      hasExplanationVideo: false,
      adminInfo: {
        problemStatement: poc.summary || "Business problem pending elaboration.",
        businessRequirements:
          `Deliver a developer-ready proof of concept for ${poc.title} with clear handoff notes.`,
        technicalRequirements:
          poc.description || "Build the requested workflow and provide implementation evidence.",
        suggestedTechStack: poc.technologies ?? [],
        supportDocuments,
        referenceLinks: [],
        deadline: poc.submittedAt ?? poc.updatedAt ?? poc.createdAt,
      },
      developerWorkspace: {
        status: stage,
        uploadedFiles,
        demoUrls: {
          liveDemoUrl: poc.demoUrl ?? null,
        },
        explanationVideo: null,
        documentationDraft: poc.developerWorkspace?.documentationDraft ?? null,
        notes: [],
        submittedForReviewAt: poc.submittedAt ?? null,
        updatedAt: poc.updatedAt,
      },
      feedback: [],
    };
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const body = await getPocDetail(pocId);
        setDetail(body);
        setReadOnlyFallback(false);
        setPurpose(body.developerWorkspace.documentationDraft?.purpose ?? "");
        setProblemItSolves(body.developerWorkspace.documentationDraft?.problemItSolves ?? "");
        setHowToUseIt(body.developerWorkspace.documentationDraft?.howToUseIt ?? "");
        setTechStack(body.developerWorkspace.documentationDraft?.techStack ?? "");
        setTeamBehindIt(body.developerWorkspace.documentationDraft?.teamBehindIt ?? "");
        setLiveDemoUrl(body.developerWorkspace.demoUrls.liveDemoUrl ?? "");
        setGithubRepositoryUrl(body.developerWorkspace.demoUrls.githubRepositoryUrl ?? "");
        setVideoLinkUrl(body.developerWorkspace.demoUrls.videoLinkUrl ?? "");
        setReferenceMaterials([]);
        setLockedSections({});
      } catch {
        try {
          const response = await fetch(`/api/pocs/${pocId}`, { cache: "no-store" });
          const body = (await response.json()) as (PocDetail & {
            message?: string | string[];
            error?: string | { message?: string | string[] };
          });
          if (!response.ok) {
            throw new Error(extractApiErrorMessage(body, "Failed to load POC"));
          }
          setDetail(mapAdminPocToDeveloperDetail(body));
          setReadOnlyFallback(true);
          setPurpose("");
          setProblemItSolves("");
          setHowToUseIt("");
          setTechStack("");
          setTeamBehindIt("");
          setLiveDemoUrl(body.developerWorkspace?.demoUrls?.liveDemoUrl ?? body.demoUrl ?? "");
          setGithubRepositoryUrl(body.developerWorkspace?.demoUrls?.githubRepositoryUrl ?? "");
          setVideoLinkUrl(body.developerWorkspace?.demoUrls?.videoLinkUrl ?? "");
          setReferenceMaterials([]);
          setLockedSections({});
        } catch (fallbackError) {
          setToast({
            message: fallbackError instanceof Error ? fallbackError.message : "Failed to load POC",
            tone: "danger",
          });
        }
      } finally {
        setLoading(false);
      }
    }

    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getPocDetail, pocId, setToast]);

  async function savePatch(payload: Parameters<typeof updatePoc>[1]) {
    if (readOnlyFallback) return;
    setSaving(true);
    try {
      const body = await updatePoc(pocId, payload);
      setDetail(body);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Update failed",
        tone: "danger",
      });
    } finally {
      setSaving(false);
    }
  }

  async function generateSection(section: GenerationSection) {
    if (!detail) return;
    const promptMap: Record<GenerationSection, string> = {
      purpose,
      problemItSolves,
      howToUseIt,
    };
    const prompt = promptMap[section].trim();
    if (!prompt) {
      setToast({ message: "Enter a raw prompt before generating", tone: "danger" });
      return;
    }
    setGeneratingSection(section);
    try {
      const response = await fetch(`/api/pocs/${detail.id}/documentation/generate`, {
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
      if (!content) {
        throw new Error("The model returned an empty response");
      }
      if (section === "purpose") setPurpose(content);
      if (section === "problemItSolves") setProblemItSolves(content);
      if (section === "howToUseIt") setHowToUseIt(content);

      if (!readOnlyFallback) {
        const updated = await updatePoc(detail.id, {
          documentationDraft: {
            ...(section === "purpose" ? { purpose: content } : {}),
            ...(section === "problemItSolves" ? { problemItSolves: content } : {}),
            ...(section === "howToUseIt" ? { howToUseIt: content } : {}),
          },
        });
        setDetail(updated);
      }
      setToast({ message: "Content generated successfully", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to generate content",
        tone: "danger",
      });
    } finally {
      setGeneratingSection(null);
    }
  }

  async function markDone(section: string) {
    if (!detail) return;
    try {
      if (section === "reference" && referenceMaterials.length > 0) {
        const duplicatePendingFile = referenceMaterials.find((file) =>
          isDuplicateReferenceFile(file),
        );
        if (duplicatePendingFile) {
          setToast({
            message: `"${duplicatePendingFile.name}" has already been uploaded for this POC`,
            tone: "danger",
          });
          return;
        }
      }

      if (!readOnlyFallback) {
        const draft = { purpose, problemItSolves, howToUseIt, techStack, teamBehindIt };
        const payload: Parameters<typeof updatePoc>[1] = { documentationDraft: draft };

        if (section === "links") {
          payload.demoUrls = buildDemoUrlsPayload({
            liveDemoUrl,
            githubRepositoryUrl,
            videoLinkUrl,
          });
        }

        if (section === "reference" && referenceMaterials.length > 0) {
          payload.addFiles = await Promise.all(
            referenceMaterials.map(async (referenceMaterial) => ({
              name: referenceMaterial.name,
              mimeType: referenceMaterial.type || "application/octet-stream",
              contentBase64: await fileToBase64(referenceMaterial),
              sizeBytes: referenceMaterial.size,
            })),
          );
        }

        const updated = await updatePoc(detail.id, payload);
        setDetail(updated);
        if (section === "reference") {
          setReferenceMaterials([]);
        }
      }
      setLockedSections((current) => ({ ...current, [section]: true }));
      setToast({ message: "Section saved", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save section",
        tone: "danger",
      });
    }
  }

  async function removeUploadedReference(fileId: string) {
    if (!detail || readOnlyFallback) return;
    try {
      const updated = await updatePoc(detail.id, {
        deleteFileId: fileId,
        documentationDraft: { purpose, problemItSolves, howToUseIt, techStack, teamBehindIt },
        demoUrls: buildDemoUrlsPayload({
          liveDemoUrl,
          githubRepositoryUrl,
          videoLinkUrl,
        }),
      });
      setDetail(updated);
      setToast({ message: "Document removed", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to remove document",
        tone: "danger",
      });
    }
  }

  function removePendingReference(fileName: string) {
    setReferenceMaterials((current) =>
      current.filter((file) => normalizeFileName(file.name) !== normalizeFileName(fileName)),
    );
  }

  function enableEdit(section: string) {
    setLockedSections((current) => ({ ...current, [section]: false }));
    setToast({ message: "Section unlocked for editing", tone: "success" });
  }

  function fieldWrapperClass(locked: boolean) {
    return locked ? "rounded-2xl border border-emerald-300 bg-emerald-50/40 p-4" : "";
  }

  function openReferencePicker() {
    if (lockedSections.reference) return;
    referenceInputRef.current?.click();
  }

  if (loading || !detail) {
    return <div className="h-80 animate-pulse rounded-2xl bg-surface-container-high" />;
  }

  const currentIndex = developerStageOrder.indexOf(detail.developerWorkspace.status);
  const nextStatus = developerStageOrder[currentIndex + 1];
  const uploadedDocuments = detail.developerWorkspace.uploadedFiles;

  const textBoxClassName =
    "mt-3 flex-1 min-h-[140px] w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-[15px] leading-7 text-on-surface outline-none placeholder:text-on-surface-variant/70";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/developer/assigned-pocs"
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[14px] font-semibold text-on-surface"
        >
          <MaterialIcon>chevron_left</MaterialIcon>
          Back to Assigned POCs
        </Link>
      </div>

      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[30px] font-semibold">{detail.title}</h1>
              <DeveloperPriorityBadge priority={detail.priority} />
              <DeveloperStatusBadge stage={detail.stage} />
            </div>
            <p className="mt-3 max-w-4xl text-[15px] leading-7 text-on-surface-variant">
              {detail.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-[14px] lg:min-w-[280px]">
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Assigned By</span>
              <span>{detail.assignedBy}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Assigned Date</span>
              <span>{formatDate(detail.assignedDate)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Deadline</span>
              <span>{formatDate(detail.deadline)}</span>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-6">
        <h2 className="mb-5 text-[18px] font-semibold">Status Flow</h2>
        <StepProgress current={detail.developerWorkspace.status} />
        {!readOnlyFallback ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {nextStatus && nextStatus !== "UNDER_ADMIN_REVIEW" && nextStatus !== "PUBLISHED" ? (
              <ActionButton
                disabled={saving}
                onClick={() => savePatch({ status: nextStatus })}
              >
                Move to {developerStageLabel[nextStatus]}
              </ActionButton>
            ) : null}
            {detail.developerWorkspace.status === "DEVELOPMENT_COMPLETED" ? (
              <ActionButton
                disabled={saving}
                variant="secondary"
                onClick={() => savePatch({ submitForReview: true })}
              >
                Submit for Review
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </SurfaceCard>

      {/* ── Admin Provided Information ── */}
      <SurfaceCard className="p-6">
        <h2 className="text-[18px] font-semibold">Admin Provided Information</h2>
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Problem Statement
            </p>
            <p className="mt-2 text-[15px] leading-7">{detail.adminInfo.problemStatement}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Business Requirements
            </p>
            <p className="mt-2 text-[15px] leading-7">{detail.adminInfo.businessRequirements}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Technical Requirements
            </p>
            <p className="mt-2 text-[15px] leading-7">{detail.adminInfo.technicalRequirements}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Suggested Tech Stack
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {detail.adminInfo.suggestedTechStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-semibold text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Support Documents
            </p>
            <div className="mt-2 space-y-2">
              {detail.adminInfo.supportDocuments.map((document) => (
                <div
                  key={document}
                  className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-[14px]"
                >
                  <span>{document}</span>
                  <button className="font-semibold text-primary">Download</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>
        
      {/* ── Documentation (inline editor) ── */}
      <SurfaceCard className="p-6">
        <h2 className="mb-6 text-[18px] font-semibold">Documentation</h2>

        <div className="grid gap-6 xl:grid-cols-2">
          {/* Purpose */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.purpose))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Purpose
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="secondary"
                  className="px-3 py-2 text-[13px]"
                  disabled={Boolean(lockedSections.purpose) || generatingSection !== null || readOnlyFallback}
                  onClick={() => generateSection("purpose")}
                >
                  {generatingSection === "purpose" ? "Generating..." : "Generate"}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("purpose")}
                  disabled={!lockedSections.purpose}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("purpose")}
                  disabled={Boolean(lockedSections.purpose) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <textarea
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Input raw prompt"
              className={textBoxClassName}
              readOnly={Boolean(lockedSections.purpose) || readOnlyFallback}
            />
          </div>

          {/* Problem It Solves */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.problem))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Problem It Solves
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="secondary"
                  className="px-3 py-2 text-[13px]"
                  disabled={Boolean(lockedSections.problem) || generatingSection !== null || readOnlyFallback}
                  onClick={() => generateSection("problemItSolves")}
                >
                  {generatingSection === "problemItSolves" ? "Generating..." : "Generate"}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("problem")}
                  disabled={!lockedSections.problem}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("problem")}
                  disabled={Boolean(lockedSections.problem) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <textarea
              value={problemItSolves}
              onChange={(event) => setProblemItSolves(event.target.value)}
              placeholder="Input raw prompt"
              className={textBoxClassName}
              readOnly={Boolean(lockedSections.problem) || readOnlyFallback}
            />
          </div>

          {/* How To Use It */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.usage))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                How To Use It
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="secondary"
                  className="px-3 py-2 text-[13px]"
                  disabled={Boolean(lockedSections.usage) || generatingSection !== null || readOnlyFallback}
                  onClick={() => generateSection("howToUseIt")}
                >
                  {generatingSection === "howToUseIt" ? "Generating..." : "Generate"}
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("usage")}
                  disabled={!lockedSections.usage}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("usage")}
                  disabled={Boolean(lockedSections.usage) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <textarea
              value={howToUseIt}
              onChange={(event) => setHowToUseIt(event.target.value)}
              placeholder="Input raw prompt"
              className={textBoxClassName}
              readOnly={Boolean(lockedSections.usage) || readOnlyFallback}
            />
          </div>

          {/* Tech Stack */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.tech))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Tech Stack
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("tech")}
                  disabled={!lockedSections.tech}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("tech")}
                  disabled={Boolean(lockedSections.tech) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <textarea
              value={techStack}
              onChange={(event) => setTechStack(event.target.value)}
              className={textBoxClassName}
              readOnly={Boolean(lockedSections.tech) || readOnlyFallback}
            />
          </div>

          {/* Team Behind It */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.team))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Team Behind It
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("team")}
                  disabled={!lockedSections.team}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("team")}
                  disabled={Boolean(lockedSections.team) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <textarea
              value={teamBehindIt}
              onChange={(event) => setTeamBehindIt(event.target.value)}
              className={textBoxClassName}
              readOnly={Boolean(lockedSections.team) || readOnlyFallback}
            />
          </div>

          {/* Reference Material */}
          <div className={`flex h-full flex-col ${fieldWrapperClass(Boolean(lockedSections.reference))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Reference Material
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("reference")}
                  disabled={!lockedSections.reference}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("reference")}
                  disabled={Boolean(lockedSections.reference) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>
            <div
              className="mt-3 flex flex-1 w-full cursor-pointer flex-col justify-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-low px-4 py-8 text-center transition-colors hover:bg-surface-container-low/80"
              role="button"
              tabIndex={lockedSections.reference ? -1 : 0}
              aria-disabled={Boolean(lockedSections.reference)}
              onClick={() => openReferencePicker()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openReferencePicker();
                }
              }}
            >
                {uploadedDocuments.length > 0 ? (
                  <div className="w-full space-y-2 text-left">
                    {uploadedDocuments.map((file) => {
                      const downloadHref = buildDownloadHref(file);
                      const fileSize = formatFileSize(file.sizeBytes);
                      return (
                        <div
                          key={file.id}
                          className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
                        >
                          <MaterialIcon className="shrink-0 text-[18px] text-on-surface-variant">
                            description
                          </MaterialIcon>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-on-surface">
                              {file.name}
                            </p>
                            <p className="mt-1 text-[12px] text-on-surface-variant">
                              {file.type.toUpperCase()}
                              {fileSize ? ` • ${fileSize}` : ""}
                              {" • "}
                              {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {downloadHref ? (
                              <a
                                href={downloadHref}
                                download={file.name}
                                className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-white px-3 py-1.5 text-[12px] font-semibold text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Download
                              </a>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-full p-1 text-on-surface-variant transition hover:bg-white hover:text-rose-600"
                              aria-label={`Remove ${file.name}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void removeUploadedReference(file.id);
                              }}
                              disabled={Boolean(lockedSections.reference) || readOnlyFallback}
                            >
                              <MaterialIcon className="text-[18px]">close</MaterialIcon>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <MaterialIcon className="text-[32px] text-on-surface-variant">
                      cloud_upload
                    </MaterialIcon>
                    <span className="text-[14px] font-semibold text-on-surface-variant">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-[12px] text-on-surface-variant/70">
                      PDF, PPT, DOCX, CSV, images, and other common documents
                    </span>
                  </>
                )}

                {referenceMaterials.length > 0 ? (
                  <div
                    className="w-full space-y-2 text-left"
                    onClick={(event) => event.preventDefault()}
                  >
                    {referenceMaterials.map((referenceMaterial) => (
                      <div
                        key={referenceMaterial.name}
                        className="flex items-start gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4"
                      >
                        <MaterialIcon className="shrink-0 text-[20px] text-on-surface-variant">
                          description
                        </MaterialIcon>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-on-surface">
                            {referenceMaterial.name}
                          </p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">
                            Ready to upload when you click Done
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1 text-on-surface-variant transition hover:bg-white hover:text-rose-600"
                          aria-label={`Remove ${referenceMaterial.name}`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            removePendingReference(referenceMaterial.name);
                          }}
                          disabled={Boolean(lockedSections.reference)}
                        >
                          <MaterialIcon className="text-[18px]">close</MaterialIcon>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {uploadedDocuments.length > 0 ? (
                  <div className="text-[12px] text-on-surface-variant/70">
                    Click this box to add another document
                  </div>
                ) : null}

                <input
                  ref={referenceInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(event) => {
                    handleReferenceMaterialChange(event.target.files, event.target);
                  }}
                  disabled={Boolean(lockedSections.reference) || readOnlyFallback}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.jpg,.jpeg,.png,.webp,.gif"
                />
            </div>
          </div>

          {/* Submission Links — spans full width */}
          <div className={`xl:col-span-2 ${fieldWrapperClass(Boolean(lockedSections.links))}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Submission Links
              </p>
              <div className="flex gap-2">
                <ActionButton
                  variant="ghost"
                  className="px-3 py-2 text-[13px]"
                  onClick={() => enableEdit("links")}
                  disabled={!lockedSections.links}
                >
                  Edit
                </ActionButton>
                <ActionButton
                  className="px-3 py-2 text-[13px]"
                  onClick={() => markDone("links")}
                  disabled={Boolean(lockedSections.links) || readOnlyFallback}
                >
                  Done
                </ActionButton>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                  Live Demo
                </p>
                <input
                  type="url"
                  value={liveDemoUrl}
                  onChange={(event) => setLiveDemoUrl(event.target.value)}
                  placeholder="https://demo.example.com"
                  readOnly={Boolean(lockedSections.links) || readOnlyFallback}
                  className="mt-3 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] outline-none placeholder:text-on-surface-variant/70"
                />
              </label>

              <label className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                  GitHub
                </p>
                <input
                  type="url"
                  value={githubRepositoryUrl}
                  onChange={(event) => setGithubRepositoryUrl(event.target.value)}
                  placeholder="https://github.com/org/repo"
                  readOnly={Boolean(lockedSections.links) || readOnlyFallback}
                  className="mt-3 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] outline-none placeholder:text-on-surface-variant/70"
                />
              </label>

              <label className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">
                  Video Link
                </p>
                <input
                  type="url"
                  value={videoLinkUrl}
                  onChange={(event) => setVideoLinkUrl(event.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  readOnly={Boolean(lockedSections.links) || readOnlyFallback}
                  className="mt-3 w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] outline-none placeholder:text-on-surface-variant/70"
                />
              </label>
            </div>
          </div>
        </div>
      </SurfaceCard>

    </div>
  );
}
