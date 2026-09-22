import { useState } from "react";
import { ApiError, api, assertValidUrl, friendlyMessage } from "../lib/api";

export function LinkForm({
  initial = "",
  submitLabel,
  onSaved,
  onCancel,
  editId,
}: {
  initial?: string;
  submitLabel: string;
  onSaved: () => void;
  onCancel?: () => void;
  editId?: number;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let url: string;
    try {
      url = assertValidUrl(value);
    } catch (err) {
      setError(friendlyMessage(err));
      return;
    }
    setPending(true);
    try {
      if (editId != null) await api.updateLink(editId, url);
      else await api.createLink(url);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.originalUrl) setError(err.fieldErrors.originalUrl);
      else setError(friendlyMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Long URL to shorten</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste a long link, like example.com/essay-on-rivers"
            inputMode="url"
            autoComplete="url"
            className="w-full rounded-full border-[1.5px] border-pine bg-white px-5 py-3.5 text-[16px] outline-none placeholder:text-pine/40 focus:border-route"
          />
        </label>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-pine/25 px-5 py-3.5 text-[15px] font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-route px-7 py-3.5 text-[15px] font-semibold text-white disabled:opacity-60 hover:brightness-110"
          >
            {pending ? "Working" : submitLabel}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[14px] font-medium text-route">
          {error}
        </p>
      )}
    </form>
  );
}

export function DeleteConfirm({
  name,
  onCancel,
  onConfirm,
  pending,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div role="alertdialog" aria-modal="true" aria-label="Delete link" className="fixed inset-0 z-50 flex items-center justify-center bg-pine/40 p-4">
      <div className="w-full max-w-md rounded-3xl border-[1.5px] border-pine bg-paper p-6">
        <h2 className="display text-2xl">Remove this chain link?</h2>
        <p className="mt-2 break-all text-[15px] text-pine/75">{name}</p>
        <p className="mt-1 text-[14px] text-pine/60">The short address stops working. This cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-pine/25 px-5 py-2.5 text-sm font-medium">
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-full bg-pine px-5 py-2.5 text-sm font-medium text-paper disabled:opacity-60 hover:bg-moss"
          >
            {pending ? "Removing" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
