import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { BookFormValues } from "@/features/books/schemas/book-schema";
import type { Control } from "react-hook-form";

interface BookFormFieldsProps {
  control: Control<BookFormValues>;
  disabled?: boolean;
}

export function BookFormFields({ control, disabled }: BookFormFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel htmlFor="title">Book title</FormLabel>
            <Input
              {...field}
              id="title"
              autoComplete="off"
              disabled={disabled}
              aria-invalid={Boolean(fieldState.error)}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="author"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel htmlFor="author">Author</FormLabel>
            <Input
              {...field}
              id="author"
              autoComplete="off"
              disabled={disabled}
              aria-invalid={Boolean(fieldState.error)}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
