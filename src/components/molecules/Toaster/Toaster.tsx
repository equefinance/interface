"use client"

import { toast, type ExternalToast } from "sonner"
import { Toaster as UiToaster, type ToasterProps } from "@/components/ui/sonner"

/** Auto-dismiss for non-error toasts per DESIGN.md §7.6. */
const DEFAULT_DURATION = 5_000

type NotifyOptions = Omit<ExternalToast, "duration">

/**
 * Eque toast helpers with DESIGN.md §7.6 timing baked in:
 * success/info/warning auto-dismiss after 5s, errors persist until
 * dismissed. `pending` returns the toast id — resolve it later with
 * `notify.success("…", { id })` / `notify.error("…", { id })`.
 */
const notify = {
  success: (title: string, opts?: NotifyOptions) =>
    toast.success(title, { duration: DEFAULT_DURATION, ...opts }),
  info: (title: string, opts?: NotifyOptions) =>
    toast(title, { duration: DEFAULT_DURATION, ...opts }),
  warning: (title: string, opts?: NotifyOptions) =>
    toast.warning(title, { duration: DEFAULT_DURATION, ...opts }),
  error: (title: string, opts?: NotifyOptions) =>
    toast.error(title, { duration: Infinity, ...opts }),
  pending: (title: string, opts?: NotifyOptions) =>
    toast.loading(title, { duration: Infinity, ...opts }),
  dismiss: (id?: string | number) => toast.dismiss(id),
}

/**
 * Eque toast notification molecule (2.12). Mount once near the app
 * root, then fire toasts with `notify` (or `toast` from "sonner"
 * directly). Bottom-right, 360px wide, z-500, sharp hairline skin.
 */
function Toaster(props: ToasterProps) {
  return <UiToaster {...props} />
}

export { Toaster, notify, toast }
