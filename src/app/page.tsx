import { WordSelection } from "~/app/_components/word-selection";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  return (
    <HydrateClient>
      <main className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
        <header className="py-6 px-4 flex-shrink-0">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-primary text-center">
            AI Vocabulary <span className="text-blue-600">Learning</span>
          </h1>
        </header>
        
        <div className="flex-1 overflow-hidden px-4 pb-6 w-full max-w-7xl mx-auto">
          <WordSelection />
        </div>
      </main>
    </HydrateClient>
  );
}
