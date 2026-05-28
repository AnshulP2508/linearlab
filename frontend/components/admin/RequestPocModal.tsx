"use client";

import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { MaterialIcon, Modal } from "./primitives";
import { RequestPocFormData, submitPocRequest } from "./usePocs";
import { CategoryItem } from "@/types/admin";
import {
  backendTechOptions,
  databaseTechOptions,
  frontendTechOptions,
  getCanonicalTechName,
  techStackOptions,
} from "./techStackOptions";

const blankForm: RequestPocFormData = {
  title: "",
  assignToEmail: "",
  problemStatement: "",
  features: "",
  techStack: [],
  categoryId: "",
  category: "",
  timeline: "",
  budget: "",
  file: null,
};

interface RequestPocModalProps {
  open: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
  onSuccess: () => void;
}

// Shared input class — identical to UsersScreen
const inputCls =
  "w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20";

// Shared label class — identical to UsersScreen
const labelCls =
  "text-[12px] font-semibold uppercase tracking-[0.08em] text-outline";

export function RequestPocModal({
  open,
  onClose,
  onSuccess,
}: RequestPocModalProps) {
  const [form, setForm] = useState<RequestPocFormData>(blankForm);
  const [techInput, setTechInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof RequestPocFormData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setForm(blankForm);
    setTechInput("");
    setErrors({});
    setSubmitError(null);
    setLoading(false);
    onClose();
  }

  function addTechTag() {
    const rawTag = techInput.trim();
    const tag = getCanonicalTechName(rawTag);
    if (!rawTag) { setTechInput(""); return; }
    if (!tag) {
      setErrors((current) => ({
        ...current,
        techStack: "Select a valid frontend or backend language/technology",
      }));
      return;
    }
    if (form.techStack.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setTechInput("");
      return;
    }
    setForm((p) => ({ ...p, techStack: [...p.techStack, tag] }));
    setErrors((current) => ({ ...current, techStack: undefined }));
    setTechInput("");
  }

  function addTechOption(option: string) {
    if (form.techStack.some((item) => item.toLowerCase() === option.toLowerCase())) {
      return;
    }
    setForm((p) => ({ ...p, techStack: [...p.techStack, option] }));
    setErrors((current) => ({ ...current, techStack: undefined }));
  }

  function removeTechTag(tag: string) {
    setForm((p) => ({ ...p, techStack: p.techStack.filter((t) => t !== tag) }));
  }

  function handleTechKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addTechTag(); }
    else if (e.key === "Backspace" && techInput === "" && form.techStack.length > 0) {
      removeTechTag(form.techStack[form.techStack.length - 1]);
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof RequestPocFormData, string>> = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.assignToEmail.trim()) {
      errs.assignToEmail = "Assign To email is required";
    } else if (!emailPattern.test(form.assignToEmail.trim())) {
      errs.assignToEmail = "Enter a valid email address";
    }
    if (!form.problemStatement.trim()) errs.problemStatement = "Problem statement is required";
    if (!form.features.trim()) errs.features = "Required features are required";
    if (techInput.trim() && !getCanonicalTechName(techInput)) {
      errs.techStack = "Select a valid frontend or backend language/technology";
    }
    if (form.techStack.some((tech) => !getCanonicalTechName(tech))) {
      errs.techStack = "Tech stack contains an unsupported language/technology";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;
    setLoading(true);
    const result = await submitPocRequest(form);
    setLoading(false);
    if (!result.ok) { setSubmitError(result.error ?? "Submission failed. Please try again."); return; }
    onSuccess();
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Request New POC">
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>

        {/* POC Title */}
        <div className="space-y-2">
          <label className={labelCls}>
            POC Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="poc-title"
            className={`${inputCls} ${errors.title ? "border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="e.g. AI-Powered Invoice Parser"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          {errors.title && (
            <p className="text-[12px] text-rose-600">{errors.title}</p>
          )}
        </div>

        {/* Assign To */}
        <div className="space-y-2">
          <label className={labelCls}>
            Assign To <span className="text-rose-500">*</span>
          </label>
          <input
            id="poc-assign-to"
            type="email"
            className={`${inputCls} ${errors.assignToEmail ? "border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="developer@example.com"
            value={form.assignToEmail}
            onChange={(e) => setForm((p) => ({ ...p, assignToEmail: e.target.value }))}
          />
          {errors.assignToEmail && (
            <p className="text-[12px] text-rose-600">{errors.assignToEmail}</p>
          )}
        </div>

        {/* Problem Statement */}
        <div className="space-y-2">
          <label className={labelCls}>
            Problem Statement <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="poc-problem"
            rows={3}
            className={`${inputCls} resize-none ${errors.problemStatement ? "border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="Describe the business problem this POC addresses..."
            value={form.problemStatement}
            onChange={(e) => setForm((p) => ({ ...p, problemStatement: e.target.value }))}
          />
          {errors.problemStatement && (
            <p className="text-[12px] text-rose-600">{errors.problemStatement}</p>
          )}
        </div>

        {/* Required Features */}
        <div className="space-y-2">
          <label className={labelCls}>
            Required Features <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="poc-features"
            rows={3}
            className={`${inputCls} resize-none ${errors.features ? "border-rose-400 focus:ring-rose-200" : ""}`}
            placeholder="List the key features or deliverables expected..."
            value={form.features}
            onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
          />
          {errors.features && (
            <p className="text-[12px] text-rose-600">{errors.features}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className={labelCls}>Category</label>
          <input
            id="poc-category"
            className={inputCls}
            placeholder="e.g. Machine Learning, Cloud, Finance…"
            value={form.category ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          />
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <label className={labelCls}>Tech Stack</label>
          <div
            className={`${inputCls} flex min-h-[42px] flex-wrap items-center gap-1.5 py-2`}
          >
            {form.techStack.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[12px] font-semibold text-primary"
              >
                {tag}
                <button
                  type="button"
                  aria-label={`Remove ${tag}`}
                  className="ml-0.5 text-primary/60 hover:text-primary"
                  onClick={() => removeTechTag(tag)}
                >
                  <MaterialIcon className="text-[13px]">close</MaterialIcon>
                </button>
              </span>
            ))}
            <input
              id="poc-tech"
              list="poc-tech-options"
              className="min-w-[140px] flex-1 bg-transparent text-[14px] outline-none placeholder:text-outline/50"
              placeholder={form.techStack.length === 0 ? "Type and press Enter…" : "Add more…"}
              value={techInput}
              onChange={(e) => {
                setTechInput(e.target.value);
                setErrors((current) => ({ ...current, techStack: undefined }));
              }}
              onKeyDown={handleTechKeyDown}
              onBlur={addTechTag}
            />
            <datalist id="poc-tech-options">
              {techStackOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          {errors.techStack ? (
            <p className="text-[12px] text-rose-600">{errors.techStack}</p>
          ) : (
            <p className="text-[11px] text-outline/70">
              Choose from approved frontend, backend, or database options and press Enter
            </p>
          )}
          <div className="grid gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3 md:grid-cols-3">
            {[
              ["Frontend", frontendTechOptions],
              ["Backend", backendTechOptions],
              ["Database", databaseTechOptions],
            ].map(([group, options]) => (
              <div key={group as string}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-outline">
                  {group as string}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(options as string[]).map((option) => {
                    const selected = form.techStack.some(
                      (item) => item.toLowerCase() === option.toLowerCase(),
                    );
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={selected}
                        className={
                          selected
                            ? "rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary opacity-60"
                            : "rounded-full border border-outline-variant bg-white px-2 py-1 text-[11px] font-semibold text-on-surface hover:border-primary hover:text-primary"
                        }
                        onClick={() => addTechOption(option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline & Budget — side by side like User Role / Password */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className={labelCls}>Timeline</label>
            <input
              id="poc-timeline"
              className={inputCls}
              placeholder="e.g. 2 weeks"
              value={form.timeline}
              onChange={(e) => setForm((p) => ({ ...p, timeline: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Budget</label>
            <input
              id="poc-budget"
              className={inputCls}
              placeholder="e.g. $5,000"
              value={form.budget}
              onChange={(e) => setForm((p) => ({ ...p, budget: e.target.value }))}
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className={labelCls}>Supporting Document (optional)</label>
          <div
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-2.5 transition-colors hover:border-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          >
            <MaterialIcon className="text-[20px] text-outline/60">upload_file</MaterialIcon>
            <span className="text-[14px] text-outline">
              {form.file ? (
                <span className="font-medium text-primary">{form.file.name}</span>
              ) : (
                "Click to attach a file"
              )}
            </span>
            {form.file ? (
              <button
                type="button"
                className="ml-auto text-outline/60 hover:text-rose-600"
                aria-label="Remove file"
                onClick={(e) => {
                  e.stopPropagation();
                  setForm((p) => ({ ...p, file: null }));
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <MaterialIcon className="text-[16px]">close</MaterialIcon>
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="Upload supporting document"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setForm((p) => ({ ...p, file }));
            }}
          />
        </div>

        {/* Submit error */}
        {submitError ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
            <MaterialIcon className="shrink-0 text-[16px]">warning</MaterialIcon>
            {submitError}
          </div>
        ) : null}

        {/* Actions — same pattern as UsersScreen */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            className="flex-1 rounded-xl border border-outline-variant px-6 py-3 text-[14px] font-medium hover:bg-surface-container-low"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary px-6 py-3 text-[14px] font-semibold text-on-primary shadow-md hover:opacity-95 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
                Submitting…
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
