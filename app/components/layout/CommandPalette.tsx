import { Command } from "cmdk";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/_primitives/dialog";
import { Icon } from "@/components/ui/Icon";
import { SearchOutlined } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface CommandPaletteItem {
  id: string;
  labelKey?: string;
  label?: string;
  subtitle?: string;
  href: string;
  groupKey?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: CommandPaletteItem[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  isSearching?: boolean;
  disableFilter?: boolean;
}

function itemLabel(item: CommandPaletteItem, t: (key: string) => string): string {
  if (item.label) return item.label;
  if (item.labelKey) return t(item.labelKey);
  return "";
}

function itemSearchValue(item: CommandPaletteItem, t: (key: string) => string): string {
  const parts = [itemLabel(item, t), item.subtitle].filter(Boolean);
  return parts.join(" ");
}

export function CommandPalette({
  open,
  onOpenChange,
  items = [],
  searchQuery = "",
  onSearchQueryChange,
  isSearching = false,
  disableFilter = false,
}: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      onSearchQueryChange?.("");
    }
  }, [open, onSearchQueryChange]);

  const groups = items.reduce<Record<string, CommandPaletteItem[]>>((acc, item) => {
    const key = item.groupKey ?? "default";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg -translate-y-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{t("command-palette-title")}</DialogTitle>
        <Command className="flex flex-col" shouldFilter={!disableFilter}>
          <div className="flex items-center gap-2 border-b border-[var(--color-gray-100)] px-3">
            <Icon icon={SearchOutlined} size={16} className="text-[var(--color-gray-400)]" />
            <Command.Input
              placeholder={t("search-placeholder")}
              value={searchQuery}
              onValueChange={onSearchQueryChange}
              className="h-11 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--color-gray-400)]"
            />
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            {isSearching ? (
              <p className="py-6 text-center text-[13px] text-[var(--color-gray-500)]">
                {t("loading")}
              </p>
            ) : (
              <Command.Empty className="py-6 text-center text-[13px] text-[var(--color-gray-500)]">
                {t("no-results")}
              </Command.Empty>
            )}
            {Object.entries(groups).map(([groupKey, groupItems]) => (
              <Command.Group
                key={groupKey}
                heading={t(groupKey)}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-gray-400)]"
              >
                {groupItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={itemSearchValue(item, t)}
                    onSelect={() => {
                      navigate(item.href);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col gap-0.5 rounded px-2 py-2 text-[13px] text-[var(--color-gray-800)]",
                      "aria-selected:bg-[var(--color-primary-50)] aria-selected:text-[var(--color-primary-800)]",
                    )}
                  >
                    <span className="font-medium">{itemLabel(item, t)}</span>
                    {item.subtitle && (
                      <span className="truncate text-[11px] text-[var(--color-gray-500)] aria-selected:text-[var(--color-primary-600)]">
                        {item.subtitle}
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, onOpenChange: setOpen };
}
