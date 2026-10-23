// A 25-line toast system: a module-level store + useSyncExternalStore.
// Used by the custom action @Notify(message, tone).
import { useSyncExternalStore } from "react";

export interface Toast {
  id: number;
  message: string;
  tone: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(message: string, tone = "info") {
  const toast = { id: Date.now() + Math.random(), message, tone };
  toasts = [...toasts, toast];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t !== toast);
    emit();
  }, 3500);
}

export function Toasts() {
  const list = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => toasts,
  );
  return (
    <div className="toasts" role="status">
      {list.map((t) => (
        <div key={t.id} className={`toast ou-tone--${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
