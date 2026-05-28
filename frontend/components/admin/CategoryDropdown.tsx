"use client";

import { useEffect, useRef } from "react";
import { CategoryItem } from "@/types/admin";
import { MaterialIcon } from "./primitives";

interface CategoryDropdownProps {
  categories: CategoryItem[];
  value: string; // "" = All
  onChange: (categoryId: string) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function CategoryDropdown({
  categories,
  value,
  onChange,
  open,
  onToggle,
  onClose,
}: CategoryDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const selectedLabel = value
    ? (categories.find((c) => c.id === value)?.name ?? "Category")
    : "All";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id="category-dropdown-toggle"
        className="flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[14px] transition hover:bg-surface-container-low"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MaterialIcon className="text-[18px]">category</MaterialIcon>
        Category: {selectedLabel}
        <span className="text-on-surface-variant">▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Filter by category"
          className="absolute left-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-lg border border-outline-variant bg-surface shadow-lg"
        >
          {/* "All" option */}
          <button
            type="button"
            role="option"
            aria-selected={value === ""}
            className={`block w-full text-left px-3 py-2 text-[14px] transition hover:bg-surface-container-low ${
              value === "" ? "bg-surface-container-low text-primary font-semibold" : "text-on-surface"
            }`}
            onClick={() => {
              onChange("");
              onClose();
            }}
          >
            All Categories
          </button>

          {categories.length > 0 ? (
            <div className="border-t border-outline-variant/40" />
          ) : null}

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="option"
              aria-selected={value === cat.id}
              className={`flex w-full items-center gap-2 text-left px-3 py-2 text-[14px] transition hover:bg-surface-container-low ${
                value === cat.id ? "bg-surface-container-low text-primary font-semibold" : "text-on-surface"
              }`}
              onClick={() => {
                onChange(cat.id);
                onClose();
              }}
            >
              {cat.color ? (
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              ) : null}
              {cat.name}
              {cat.usageCount > 0 ? (
                <span className="ml-auto text-[11px] text-on-surface-variant">{cat.usageCount}</span>
              ) : null}
            </button>
          ))}

          {categories.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-on-surface-variant italic">No categories yet</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
