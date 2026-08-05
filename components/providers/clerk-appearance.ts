import type { NextClerkProviderProps } from "@clerk/nextjs/types";

/**
 * Shared Clerk styling that resolves through MindVault's semantic CSS tokens.
 * The variables stay current when next-themes adds or removes the `dark` class.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorPrimaryForeground: "var(--primary-foreground)",
    colorBackground: "var(--card)",
    colorInput: "var(--input)",
    colorInputForeground: "var(--foreground)",
    colorForeground: "var(--foreground)",
    colorMuted: "var(--muted)",
    colorMutedForeground: "var(--muted-foreground)",
    colorDanger: "var(--destructive)",
    colorNeutral: "var(--border)",
    colorBorder: "var(--border)",
    colorRing: "var(--ring)",
    colorModalBackdrop: "var(--background)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    card: "border border-border bg-card text-card-foreground shadow-lg",
    cardBox: "shadow-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    main: "text-foreground",
    formFieldLabel: "text-foreground",
    formFieldInput:
      "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring",
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
    socialButtonsBlockButton:
      "border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
    socialButtonsBlockButtonText: "text-foreground",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    footer: "bg-muted/40",
    footerActionText: "text-muted-foreground",
    footerActionLink: "text-primary hover:text-primary/80",
    identityPreviewText: "text-foreground",
    formResendCodeLink: "text-primary hover:text-primary/80",
    alert: "border-border bg-muted text-foreground",
    alertText: "text-foreground",
    userButtonPopoverCard: "border border-border bg-popover text-popover-foreground shadow-lg",
    userButtonPopoverMain: "bg-popover",
    userButtonPopoverActionButton:
      "text-popover-foreground hover:bg-accent hover:text-accent-foreground",
    userButtonPopoverActionButtonText: "text-popover-foreground",
    userButtonPopoverFooter: "border-border bg-muted/40",
    userPreviewTextContainer: "text-popover-foreground",
    userPreviewSecondaryIdentifier: "text-muted-foreground",
    modalBackdrop: "bg-background/70 backdrop-blur-sm",
    modalContent: "border border-border bg-card text-card-foreground shadow-xl",
    navbar: "border-border bg-muted/40",
    navbarButton: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    navbarButtonActive: "bg-accent text-accent-foreground",
    pageScrollBox: "bg-card",
    profileSectionTitle: "text-foreground",
    profileSectionContent: "border-border bg-card",
    profileSectionPrimaryButton:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring",
  },
} satisfies NonNullable<NextClerkProviderProps["appearance"]>;
