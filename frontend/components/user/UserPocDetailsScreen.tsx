"use client";

import Link from "next/link";
import {
  ActionButton,
  EmptyState,
  MaterialIcon,
  SurfaceCard,
} from "@/components/admin/primitives";
import { useRemoteData } from "@/components/admin/useRemoteData";
import { UserFeedbackItem, UserPocDetail } from "@/types/user";
import { useMemo, useState } from "react";
import { useUserWorkspace } from "./UserWorkspaceContext";
import { buildDownloadHref, formatDate, formatFileSize, initials } from "./userUtils";

const initialPocDetail: UserPocDetail = {
  id: "",
  title: "",
  slug: "",
  summary: "",
  description: "",
  fullDescription: "",
  technologies: [],
  category: null,
  developer: null,
  createdAt: "",
  updatedAt: "",
  ratingAverage: 0,
  ratingCount: 0,
  feedbacks: [],
  documents: [],
  demos: [],
  developerWorkspace: null,
};

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "feedback", label: "Feedback" },
] as const;

type DetailTab = (typeof tabs)[number]["key"];

function StarRating({
  value,
  interactive = false,
  onChange,
  onHover,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  onHover?: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= value;
        return interactive ? (
          <button
            key={starValue}
            type="button"
            className="text-amber-500 transition hover:scale-105"
            onMouseEnter={() => onHover?.(starValue)}
            onFocus={() => onHover?.(starValue)}
            onClick={() => onChange?.(starValue)}
          >
            <MaterialIcon className="text-[22px]" filled={active}>
              star
            </MaterialIcon>
          </button>
        ) : (
          <span key={starValue} className="text-amber-500">
            <MaterialIcon className="text-[18px]" filled={active}>
              star
            </MaterialIcon>
          </span>
        );
      })}
    </div>
  );
}

function FeedbackCard({ item }: { item: UserFeedbackItem }) {
  return (
    <SurfaceCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-[13px] font-bold text-white">
            {initials(item.user.name)}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-on-surface">{item.user.name}</p>
            <p className="text-[12px] text-on-surface-variant">{formatDate(item.createdAt)}</p>
          </div>
        </div>
        <StarRating value={item.rating} />
      </div>
      <p className="mt-4 text-[15px] leading-7 text-on-surface-variant">{item.comment}</p>
    </SurfaceCard>
  );
}

function DetailSkeleton() {
  return <div className="h-80 animate-pulse rounded-2xl bg-surface-container-high" />;
}

function toEmbedUrl(url: string) {
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  return null;
}

export function UserPocDetailsScreen({ pocId }: { pocId: string }) {
  const { data, loading, setData } = useRemoteData<UserPocDetail>(
    `/api/user/pocs/${pocId}`,
    initialPocDetail,
  );
  const { profile, setToast } = useUserWorkspace();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const documentationSections = useMemo(() => {
    const draft = data.developerWorkspace?.documentationDraft;
    return [
      { key: "purpose", title: "Purpose", content: draft?.purpose?.trim() ?? "" },
      {
        key: "problem",
        title: "Problem It Solves",
        content: draft?.problemItSolves?.trim() ?? "",
      },
      { key: "usage", title: "How To Use It", content: draft?.howToUseIt?.trim() ?? "" },
      { key: "tech", title: "Tech Stack", content: draft?.techStack?.trim() ?? "" },
      { key: "team", title: "Team Behind It", content: draft?.teamBehindIt?.trim() ?? "" },
    ].filter((section) => section.content);
  }, [data.developerWorkspace]);

  const visibleDemos = useMemo(
    () => data.demos.filter((demo) => demo.label.trim().toLowerCase() !== "explanation video"),
    [data.demos],
  );

  async function submitFeedback() {
    if (!profile) return;
    if (rating < 1) {
      setToast({ message: "Please select a star rating", tone: "danger" });
      return;
    }
    if (comment.trim().length < 10) {
      setToast({ message: "Comment must be at least 10 characters long", tone: "danger" });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pocId,
          rating,
          comment: comment.trim(),
        }),
      });
      const body = (await response.json()) as UserFeedbackItem & {
        error?: string;
        message?: string | string[];
      };
      if (!response.ok) {
        const message = Array.isArray(body.message) ? body.message[0] : body.message;
        throw new Error(message ?? body.error ?? "Failed to submit feedback");
      }

      setData((current) => ({
        ...current,
        feedbacks: [body, ...current.feedbacks],
        ratingCount: current.feedbacks.length + 1,
        ratingAverage:
          (current.feedbacks.reduce((sum, item) => sum + item.rating, 0) + body.rating) /
          (current.feedbacks.length + 1),
      }));
      setRating(0);
      setHoverRating(0);
      setComment("");
      setToast({ message: "Feedback submitted successfully", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to submit feedback",
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!data.id) {
    return (
      <EmptyState
        title="POC not found"
        description="The proof of concept you requested is not available."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/user/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[14px] font-semibold text-on-surface"
        >
          <MaterialIcon>chevron_left</MaterialIcon>
          Back to Dashboard
        </Link>
      </div>

      <SurfaceCard className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[30px] font-semibold">{data.title}</h1>
              {data.category ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                  {data.category.name}
                </span>
              ) : null}
            </div>
            <p className="mt-3 max-w-4xl text-[15px] leading-7 text-on-surface-variant">
              {data.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.technologies.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-semibold text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-[14px] lg:min-w-[280px]">
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Created</span>
              <span>{formatDate(data.createdAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Updated</span>
              <span>{formatDate(data.updatedAt)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-on-surface-variant">Rating</span>
              <span>{data.ratingAverage.toFixed(1)} / 5</span>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-white"
                : "rounded-xl border border-outline-variant bg-white px-4 py-2 text-[14px] font-semibold text-on-surface transition hover:bg-surface-container-low"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SurfaceCard className="p-6">
            <h2 className="text-[18px] font-semibold">Overview</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-on-surface-variant">
              {data.fullDescription || data.description}
            </p>

            {documentationSections.length > 0 ? (
              <div className="mt-8 space-y-5">
                {documentationSections.map((section) => (
                  <div key={section.key}>
                    <p className="text-[16px] font-bold tracking-[0.01em] text-on-surface">
                      {section.title}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-on-surface-variant">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-10 border-t border-outline-variant/60 pt-8">
              <h2 className="text-[18px] font-semibold">Documentation</h2>
              {data.documents.length === 0 ? (
                <EmptyState
                  className="mt-5 min-h-[220px]"
                  title="No documents available"
                  description="Documentation files will appear here when they are shared for this POC."
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {data.documents.map((document) => {
                    const downloadHref = buildDownloadHref(document);
                    return (
                      <div
                        key={document.id}
                        className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MaterialIcon>download</MaterialIcon>
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-on-surface">
                              {document.name}
                            </p>
                            <p className="mt-1 text-[12px] text-on-surface-variant">
                              {document.type.toUpperCase()}
                              {formatFileSize(document.sizeBytes)
                                ? ` • ${formatFileSize(document.sizeBytes)}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        {downloadHref ? (
                          <a
                            href={downloadHref}
                            download={document.name}
                            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-[13px] text-on-surface-variant">Preview only</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-10 border-t border-outline-variant/60 pt-8">
              <h2 className="text-[18px] font-semibold">Demo</h2>
              {visibleDemos.length === 0 ? (
                <EmptyState
                  className="mt-5 min-h-[220px]"
                  title="No demos available"
                  description="Demo links and walkthroughs will appear here when the POC is shared."
                />
              ) : (
                <div className="mt-5 grid gap-5">
                  {visibleDemos.map((demo) => {
                    const embedUrl = demo.type === "url" ? toEmbedUrl(demo.value) : null;
                    return (
                      <div
                        key={demo.id}
                        className="rounded-2xl border border-outline-variant bg-surface-container-low p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-[15px] font-semibold text-on-surface">
                              {demo.label}
                            </p>
                            <p className="mt-1 break-all text-[13px] text-on-surface-variant">
                              {demo.value}
                            </p>
                          </div>
                          <a
                            href={demo.value}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white"
                          >
                            Open Demo
                          </a>
                        </div>

                        {embedUrl ? (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-outline-variant bg-black">
                            <iframe
                              src={embedUrl}
                              title={demo.label}
                              className="aspect-video w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard className="self-start p-6">
            <h2 className="text-[18px] font-semibold">Developer Info</h2>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-[15px] font-bold text-white">
                {initials(data.developer?.name ?? "Developer")}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-on-surface">
                  {data.developer?.name ?? "Assigned Developer"}
                </p>
                <p className="text-[13px] text-on-surface-variant">
                  {data.developer?.team ?? "POC Delivery"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-[14px]">
              <div className="flex justify-between gap-4">
                <span className="text-on-surface-variant">Email</span>
                <span className="text-right">{data.developer?.email ?? "Not shared"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-on-surface-variant">Joined</span>
                <span>{formatDate(data.developer?.createdAt ?? null)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-on-surface-variant">Feedback</span>
                <span>{data.feedbacks.length} responses</span>
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {activeTab === "feedback" ? (
        <div className="space-y-6">
          <div className="grid gap-4">
            {data.feedbacks.length > 0 ? (
              data.feedbacks.map((item) => <FeedbackCard key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="No feedback yet"
                description="Be the first to share what worked well and what could be improved."
              />
            )}
          </div>

          <SurfaceCard className="p-6">
            <h2 className="text-[18px] font-semibold">Give Feedback</h2>
            {!profile ? (
              <p className="mt-4 text-[14px] text-on-surface-variant">
                Sign in to submit feedback on this POC.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    Rating
                  </p>
                  <div className="mt-3" onMouseLeave={() => setHoverRating(0)}>
                    <StarRating
                      value={hoverRating || rating}
                      interactive
                      onChange={setRating}
                      onHover={setHoverRating}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    Comment
                  </p>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Share what you liked, what could improve, and how useful this POC feels."
                    className="mt-3 min-h-[140px] w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-[15px] leading-7 text-on-surface outline-none placeholder:text-on-surface-variant/70"
                  />
                </div>

                <ActionButton onClick={() => void submitFeedback()} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </ActionButton>
              </div>
            )}
          </SurfaceCard>
        </div>
      ) : null}
    </div>
  );
}
