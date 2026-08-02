"use client";

import { Button } from "@/components/ui/button";
import {
  BOOK_UPLOAD_ACCEPT,
  BOOK_UPLOAD_FIELD_CONTENT,
  BOOK_UPLOAD_LIMITS,
} from "@/features/books/constants/book-upload";
import { cn } from "@/lib/utils";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

interface PdfUploadFieldProps {
  value?: File;
  error?: string;
  disabled?: boolean;
  onChange: (file?: File) => void;
}

const bytesToMegabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function PdfUploadField({ value, error, disabled, onChange }: PdfUploadFieldProps) {
  const [rejectionMessage, setRejectionMessage] = useState<string>();
  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    accept: BOOK_UPLOAD_ACCEPT.pdf,
    disabled,
    maxFiles: 1,
    maxSize: BOOK_UPLOAD_LIMITS.pdfBytes,
    multiple: false,
    noClick: true,
    onDropAccepted: ([file]) => {
      setRejectionMessage(undefined);
      onChange(file);
    },
    onDropRejected: ([rejection]) => {
      setRejectionMessage(rejection.errors[0]?.message ?? "Choose a PDF within the allowed file size.");
      onChange(undefined);
    },
  });
  const message = error ?? rejectionMessage;

  return (
    <div className="space-y-3">
      {value ? (
        <div className="border-border bg-muted/50 flex items-center gap-3 rounded-xl border p-3">
          <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
            <FileText className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-muted-foreground text-xs">{bytesToMegabytes(value.size)}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(undefined)} disabled={disabled} aria-label={BOOK_UPLOAD_FIELD_CONTENT.pdf.remove}>
            <Trash2 className="text-muted-foreground" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-border bg-muted/30 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors",
            isDragActive && "border-primary bg-primary/5",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} aria-describedby="pdf-upload-help pdf-upload-error" />
          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <UploadCloud className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium">{BOOK_UPLOAD_FIELD_CONTENT.pdf.prompt}</p>
          <p id="pdf-upload-help" className="text-muted-foreground mt-1 text-sm">
            {BOOK_UPLOAD_FIELD_CONTENT.pdf.help}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={open} disabled={disabled}>
            {BOOK_UPLOAD_FIELD_CONTENT.pdf.choose}
          </Button>
        </div>
      )}
      {message && <p id="pdf-upload-error" role="alert" className="text-destructive text-sm">{message}</p>}
    </div>
  );
}
