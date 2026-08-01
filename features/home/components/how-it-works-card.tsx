import {
  HOW_IT_WORKS_STEPS,
  HOME_CONTENT,
} from "@/features/home/constants/home-content";

export function HowItWorksCard() {
  const { howItWorks } = HOME_CONTENT;

  return (
    <aside className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
      <p className="text-primary text-sm font-semibold">{howItWorks.eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{howItWorks.title}</h2>

      <ol className="mt-5 space-y-4">
        {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, description }, index) => (
          <li key={title} className="flex gap-3">
            <span className="border-border bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="text-primary size-4" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{title}</h3>
              </div>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
