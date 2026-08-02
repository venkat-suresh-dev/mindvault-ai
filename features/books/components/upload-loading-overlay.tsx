import { LoaderCircle } from "lucide-react";

export function UploadLoadingOverlay() {
  return (
    <div className="bg-background/80 absolute inset-0 z-10 grid place-items-center rounded-2xl p-6 text-center backdrop-blur-sm" role="status" aria-live="polite">
      <div className="bg-card border-border max-w-xs rounded-xl border p-5 shadow-lg">
        <LoaderCircle className="text-primary mx-auto size-6 animate-spin" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold">Preparing your book for AI processing...</p>
        <p className="text-muted-foreground mt-1 text-sm">Your source and preferences are being checked securely.</p>
      </div>
    </div>
  );
}
