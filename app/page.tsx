import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Mic, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="flex max-w-4xl flex-col items-center text-center">
          <div className="bg-muted mb-6 flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
            <Sparkles className="text-primary h-4 w-4" />
            AI-powered personal knowledge platform
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Talk to your books.
            <br />
            <span className="text-primary">Unlock your knowledge.</span>
          </h1>

          <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
            MindVault AI transforms your PDFs, documents, and notes into an
            intelligent assistant. Ask questions, search your knowledge, and
            have natural voice conversations with your data.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button size="lg">
              <BookOpen className="mr-2 h-5 w-5" />
              Build Your Knowledge Vault
            </Button>

            <Button size="lg" variant="outline">
              <Mic className="mr-2 h-5 w-5" />
              Try Voice AI
            </Button>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={<Brain />}
              title="AI Memory"
              description="Your documents become an intelligent assistant."
            />

            <FeatureCard
              icon={<BookOpen />}
              title="Document Chat"
              description="Ask questions and get answers with context."
            />

            <FeatureCard
              icon={<Mic />}
              title="Voice Conversations"
              description="Talk naturally with your knowledge."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-xl border p-6 text-left">
      <div className="bg-primary/10 text-primary mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
        {icon}
      </div>

      <h3 className="font-semibold">{title}</h3>

      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}
