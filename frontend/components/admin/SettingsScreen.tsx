"use client";

import { PlatformSettings } from "@/types/admin";
import { FormEvent, useState } from "react";
import { Button, Card, PageHeader, Toast } from "./primitives";
import { useRemoteData } from "./useRemoteData";

const initialSettings: PlatformSettings = {
  logoText: "LinearLab",
  theme: "Corporate Indigo",
  storageProvider: "Local Storage",
  emailSender: "admin@poc.local",
  demoApprovalRequired: true,
  fileUploadLimitMb: 50,
};

export function SettingsScreen() {
  const { data, setData } = useRemoteData<PlatformSettings>(
    "/api/admin/settings",
    initialSettings,
  );
  const [toast, setToast] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as PlatformSettings;
    setData(updated);
    setToast("Settings saved");
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        description="Configure branding, storage, workflow rules, and upload limits."
      />
      <Card className="max-w-3xl p-6">
        <form className="space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Logo Text</span>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={data.logoText} onChange={(event) => setData({ ...data, logoText: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Theme</span>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={data.theme} onChange={(event) => setData({ ...data, theme: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Storage Provider</span>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={data.storageProvider} onChange={(event) => setData({ ...data, storageProvider: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email Sender</span>
            <input className="w-full rounded-xl border border-border px-4 py-3" value={data.emailSender} onChange={(event) => setData({ ...data, emailSender: event.target.value })} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">File Upload Limit (MB)</span>
            <input className="w-full rounded-xl border border-border px-4 py-3" type="number" value={data.fileUploadLimitMb} onChange={(event) => setData({ ...data, fileUploadLimitMb: Number(event.target.value) })} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-surface-muted p-4">
            <input type="checkbox" checked={data.demoApprovalRequired} onChange={(event) => setData({ ...data, demoApprovalRequired: event.target.checked })} />
            <span className="text-sm font-medium">Require admin approval before demos go live</span>
          </label>
          <Button type="submit">Save Settings</Button>
        </form>
      </Card>
      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
