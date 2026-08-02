"use client";

import { Button } from "@/components/ui/button";
import {
  BOOK_UPLOAD_ACCEPT,
  BOOK_UPLOAD_FIELD_CONTENT,
  BOOK_UPLOAD_LIMITS,
} from "@/features/books/constants/book-upload";
import { cn } from "@/lib/utils";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

interface CoverUploadFieldProps {
  value?: File;
  error?: string;
  disabled?: boolean;
  onChange: (file?: File) => void;
}

export function CoverUploadField({ value, error, disabled, onChange }: CoverUploadFieldProps) {
  const [rejectionMessage, setRejectionMessage] = useState<string>();
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : undefined),
    [value],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    accept: BOOK_UPLOAD_ACCEPT.cover,
    disabled,
    maxFiles: 1,
    maxSize: BOOK_UPLOAD_LIMITS.coverBytes,
    multiple: false,
    noClick: true,
    onDropAccepted: ([file]) => {
      setRejectionMessage(undefined);
      onChange(file);
    },
    onDropRejected: ([rejection]) => {
      setRejectionMessage(rejection.errors[0]?.message ?? "Choose a supported cover image within the allowed file size.");
    },
  });
  const message = error ?? rejectionMessage;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div
          {...getRootProps()}
          className={cn(
            "border-border bg-muted/30 relative flex aspect-[3/4] w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed transition-colors",
            isDragActive && "border-primary bg-primary/5",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} aria-describedby="cover-upload-help cover-upload-error" />
          {previewUrl ? (
            <Image src={previewUrl} alt="Selected book cover preview" fill unoptimized className="object-cover" />
          ) : (
            <ImagePlus className="text-muted-foreground size-5" aria-hidden="true" />
          )}
        </div>
        <div className="pt-1">
          <p className="text-sm font-medium">{BOOK_UPLOAD_FIELD_CONTENT.cover.title}</p>
          <p id="cover-upload-help" className="text-muted-foreground mt-1 text-sm leading-5">
            {BOOK_UPLOAD_FIELD_CONTENT.cover.help}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={open} disabled={disabled}>
              {value ? BOOK_UPLOAD_FIELD_CONTENT.cover.replace : BOOK_UPLOAD_FIELD_CONTENT.cover.choose}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)} disabled={disabled}>
                <Trash2 aria-hidden="true" />
                {BOOK_UPLOAD_FIELD_CONTENT.cover.remove}
              </Button>
            )}
          </div>
        </div>
      </div>
      {message && <p id="cover-upload-error" role="alert" className="text-destructive text-sm">{message}</p>}
    </div>
  );
}
