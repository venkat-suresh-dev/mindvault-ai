import { Show } from "@clerk/nextjs";
import { GuestActions } from "./guest-actions";
import { UserProfile } from "./user-profile";

interface AuthSectionProps {
  displayName: string;
}

export function AuthSection({ displayName }: AuthSectionProps) {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <GuestActions />
      </Show>
      <Show when="signed-in">
        <UserProfile displayName={displayName} />
      </Show>
    </div>
  );
}
