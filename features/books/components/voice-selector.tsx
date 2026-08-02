import { Select } from "@/components/ui/select";
import { VOICE_PERSONAS } from "@/features/books/constants/voice-personas";
import type { VoicePersonaId } from "@/features/books/constants/voice-personas";

interface VoiceSelectorProps {
  value: VoicePersonaId;
  error?: string;
  disabled?: boolean;
  onChange: (value: VoicePersonaId) => void;
}

export function VoiceSelector({ value, error, disabled, onChange }: VoiceSelectorProps) {
  const selectedPersona = VOICE_PERSONAS.find((persona) => persona.id === value);
  const SelectedIcon = selectedPersona?.icon;

  return (
    <div className="space-y-3">
      <Select
        value={value}
        disabled={disabled}
        aria-label="AI voice persona"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "voice-persona-error" : undefined}
        onChange={(event) => onChange(event.target.value as VoicePersonaId)}
      >
        {VOICE_PERSONAS.map(({ id, name, availability }) => (
          <option key={id} value={id} disabled={availability !== "available"}>
            {name}
          </option>
        ))}
      </Select>

      {selectedPersona && SelectedIcon && (
        <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
          <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <SelectedIcon className="size-4" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground text-sm">{selectedPersona.description}</p>
        </div>
      )}

      {error && <p id="voice-persona-error" role="alert" className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
