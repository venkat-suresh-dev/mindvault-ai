"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createBook } from "@/features/books/actions/create-book";
import {
  BOOK_PAGE_CONTENT,
  BOOK_UPLOAD_FIELD_CONTENT,
} from "@/features/books/constants/book-upload";
import { bookFormSchema, type BookFormValues } from "@/features/books/schemas/book-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BookFormFields } from "./book-form-fields";
import { CoverUploadField } from "./cover-upload-field";
import { PdfUploadField } from "./pdf-upload-field";
import { UploadLoadingOverlay } from "./upload-loading-overlay";
import { VoiceSelector } from "./voice-selector";

export function BookUploadForm() {
  const { isSignedIn } = useAuth();
  const [submissionMessage, setSubmissionMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      voicePersona: "wise-professor",
    },
  });

  const pdfFile = useWatch({ control: form.control, name: "pdfFile" });
  const coverImage = useWatch({ control: form.control, name: "coverImage" });
  const voicePersona = useWatch({ control: form.control, name: "voicePersona" });

  const setPdfFile = (file?: File) => {
    if (file) {
      form.setValue("pdfFile", file, { shouldDirty: true, shouldValidate: true });
      form.clearErrors("pdfFile");
    } else {
      form.resetField("pdfFile");
    }
  };

  const setCoverImage = (file?: File) => {
    form.setValue("coverImage", file, { shouldDirty: true, shouldValidate: true });
    form.clearErrors("coverImage");
  };

  const onSubmit = async (values: BookFormValues) => {
    setSubmissionMessage(undefined);

    if (!isSignedIn) {
      setSubmissionMessage(BOOK_PAGE_CONTENT.form.authenticationMessage);
      return;
    }

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("author", values.author);
    formData.set("pdfFile", values.pdfFile);
    formData.set("voicePersona", values.voicePersona);
    if (values.coverImage) formData.set("coverImage", values.coverImage);

    setIsSubmitting(true);
    try {
      const result = await createBook(formData);
      setSubmissionMessage(result.message);
    } catch {
      setSubmissionMessage("We couldn't prepare your book right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="border-border bg-card relative rounded-2xl border p-5 shadow-sm sm:p-7" noValidate>
      {isSubmitting && <UploadLoadingOverlay />}
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{BOOK_PAGE_CONTENT.form.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">{BOOK_PAGE_CONTENT.form.description}</p>
        </div>
      </div>

      {!isSignedIn && (
        <div className="border-border bg-muted/50 mt-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">{BOOK_PAGE_CONTENT.form.authenticationMessage}</p>
          <SignInButton mode="modal">
            <Button type="button" size="sm">Sign in</Button>
          </SignInButton>
        </div>
      )}

      <fieldset disabled={disabled} className="mt-7 space-y-7">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{BOOK_UPLOAD_FIELD_CONTENT.pdf.label}</legend>
          <PdfUploadField value={pdfFile} error={form.formState.errors.pdfFile?.message} disabled={disabled} onChange={setPdfFile} />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{BOOK_UPLOAD_FIELD_CONTENT.cover.label}</legend>
          <CoverUploadField value={coverImage} error={form.formState.errors.coverImage?.message} disabled={disabled} onChange={setCoverImage} />
        </fieldset>

        <BookFormFields control={form.control} disabled={disabled} />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{BOOK_UPLOAD_FIELD_CONTENT.voice.label}</legend>
          <p className="text-muted-foreground mt-1 text-sm">{BOOK_UPLOAD_FIELD_CONTENT.voice.help}</p>
          <VoiceSelector value={voicePersona} error={form.formState.errors.voicePersona?.message} disabled={disabled} onChange={(value) => form.setValue("voicePersona", value, { shouldDirty: true, shouldValidate: true })} />
        </fieldset>
      </fieldset>

      {submissionMessage && (
        <p role="status" aria-live="polite" className="border-border bg-muted/50 mt-6 flex gap-2 rounded-xl border p-3 text-sm">
          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {submissionMessage}
        </p>
      )}

      <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          {BOOK_UPLOAD_FIELD_CONTENT.privacy}
        </p>
        <Button type="submit" size="lg" disabled={disabled}>
          {BOOK_PAGE_CONTENT.form.submit}
        </Button>
      </div>
      </form>
    </Form>
  );
}
