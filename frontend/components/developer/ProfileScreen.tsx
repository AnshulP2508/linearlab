"use client";

import { ActionButton, MaterialIcon, SurfaceCard } from "@/components/admin/primitives";
import { FormEvent, KeyboardEvent, useState } from "react";
import { useDeveloperWorkspace } from "./DeveloperWorkspaceContext";
import { initials } from "./developerUtils";

export function ProfileScreen() {
  const { profile } = useDeveloperWorkspace();

  if (!profile) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-container-high" />;
  }

  return <ProfileEditor key={profile.id} profile={profile} />;
}

function ProfileEditor({
  profile,
}: {
  profile: NonNullable<ReturnType<typeof useDeveloperWorkspace>["profile"]>;
}) {
  const { updateProfile, changePassword, setToast } = useDeveloperWorkspace();
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function addSkill() {
    const next = skillInput.trim();
    if (!next || skills.includes(next)) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, next]);
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((item) => item !== skill));
  }

  function onSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ name, avatarUrl, skills });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Profile update failed",
        tone: "danger",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Password change failed",
        tone: "danger",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-[14px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SurfaceCard className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-container text-[28px] font-bold text-white">
            {initials(profile?.name ?? "Developer")}
          </div>
          <h2 className="mt-4 text-[22px] font-semibold">{profile?.name}</h2>
          <p className="text-[14px] text-on-surface-variant">{profile?.email}</p>
          <p className="mt-2 rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-semibold text-primary">
            {profile?.team ?? "POC Delivery"}
          </p>
        </div>
      </SurfaceCard>

      <div className="space-y-6">
        <SurfaceCard className="p-6">
          <form className="space-y-5" onSubmit={saveProfile}>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Name
              </label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Email
              </label>
              <input className={inputCls} value={profile?.email ?? ""} disabled />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Profile Picture URL
              </label>
              <input
                className={inputCls}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Skills / Tech Stack
              </label>
              <div className="flex min-h-[52px] flex-wrap items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 py-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <MaterialIcon className="text-[13px]">close</MaterialIcon>
                    </button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={onSkillKeyDown}
                  onBlur={addSkill}
                  className="min-w-[160px] flex-1 bg-transparent text-[14px] outline-none"
                  placeholder="Add a skill and press Enter"
                />
              </div>
            </div>
            <ActionButton type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </ActionButton>
          </form>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <form className="space-y-5" onSubmit={savePassword}>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Current Password
              </label>
              <input
                type="password"
                className={inputCls}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                New Password
              </label>
              <input
                type="password"
                className={inputCls}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <ActionButton type="submit" variant="secondary" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Change Password"}
            </ActionButton>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
