"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Volume2, Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Rating } from "ts-fsrs";

const cefrColor = (cefr: string) => {
  if (cefr.startsWith("A")) return "text-green-500";
  if (cefr.startsWith("B")) return "text-blue-500";
  if (cefr.startsWith("C")) return "text-purple-500";
  return "text-gray-500";
};

export function WordSelection() {
  const [quotas, setQuotas] = useState({ basic: 30, independent: 60, proficient: 10 });
  const [words, setWords] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState("B1");
  const [story, setStory] = useState("");
  const [reviewedWords, setReviewedWords] = useState<Record<number, boolean>>({});

  const utils = api.useUtils();
  const generateQuery = api.word.generateSelection.useQuery(
    quotas,
    { enabled: false }
  );

  const generateStoryMutation = api.word.generateStory.useMutation({
    onSuccess: (data) => {
      setStory(data);
    },
  });

  const submitReviewMutation = api.word.submitReview.useMutation({
    onSuccess: (_, variables) => {
      setReviewedWords((prev) => ({ ...prev, [variables.wordId]: true }));
    },
  });

  const handleGenerate = async () => {
    const { data } = await generateQuery.refetch();
    if (data) {
      setWords(data);
      setStory("");
      setReviewedWords({});
    }
  };

  const handleGenerateStory = () => {
    const unreviewedWords = words.filter((w) => !reviewedWords[w.id]);
    if (unreviewedWords.length === 0) return;
    
    generateStoryMutation.mutate({
      words: unreviewedWords.map((w) => w.text),
      difficulty,
    });
  };

  const unreviewedCount = words.filter((w) => !reviewedWords[w.id]).length;

  const handleReview = (wordId: number, rating: Rating) => {
    submitReviewMutation.mutate({ wordId, rating });
  };

  const playTTS = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden items-start">
      {/* Left Column: Word Selection & List */}
      <div className="h-full overflow-y-auto pr-2 space-y-8 pb-8">
        <Card className="shadow-md border-2 border-muted/50 pt-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Word Selection Quotas (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="quota-basic" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Basic (A1/A2)</label>
                <Input
                  id="quota-basic"
                  type="number"
                  value={quotas.basic}
                  onChange={(e) => setQuotas({ ...quotas, basic: Number(e.target.value) })}
                  className="h-10 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quota-independent" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Independent (B1/B2)</label>
                <Input
                  id="quota-independent"
                  type="number"
                  value={quotas.independent}
                  onChange={(e) => setQuotas({ ...quotas, independent: Number(e.target.value) })}
                  className="h-10 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="quota-proficient" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proficient (C1/C2)</label>
                <Input
                  id="quota-proficient"
                  type="number"
                  value={quotas.proficient}
                  onChange={(e) => setQuotas({ ...quotas, proficient: Number(e.target.value) })}
                  className="h-10 font-semibold"
                />
              </div>
            </div>
            <Button
              className="mt-6 w-full h-11 text-base font-bold shadow-sm"
              onClick={handleGenerate}
              disabled={generateQuery.isFetching}
            >
              {generateQuery.isFetching ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-5 w-5" />
              )}
              Generate 30 Practice Words
            </Button>
          </CardContent>
        </Card>

        {words.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {words.map((word) => (
              <Card key={word.id} className={`hover:shadow-md transition-all duration-200 border-l-4 border-r border-t border-b ${word.cefr.startsWith("A") ? "border-l-green-500" :
                  word.cefr.startsWith("B") ? "border-l-blue-500" :
                    "border-l-purple-500"
                } ${reviewedWords[word.id] ? "opacity-50 grayscale bg-muted/30" : "bg-card shadow-sm border-muted/50"}`}>
                <CardContent className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-xl font-bold ${cefrColor(word.cefr)} tracking-tight`}>
                        {word.text}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary/50 text-secondary-foreground w-fit mt-1">
                        {word.cefr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => playTTS(word.text)}>
                        <Volume2 className="h-5 w-5" />
                      </Button>
                      {reviewedWords[word.id] && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                    </div>
                  </div>

                  {!reviewedWords[word.id] && (
                    <div className="grid grid-cols-4 gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-8 px-1 font-bold bg-red-50 hover:bg-red-100 hover:text-red-700 border-red-200 transition-colors"
                        onClick={() => handleReview(word.id, Rating.Again)}
                      >
                        Again
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-8 px-1 font-bold bg-orange-50 hover:bg-orange-100 hover:text-orange-700 border-orange-200 transition-colors"
                        onClick={() => handleReview(word.id, Rating.Hard)}
                      >
                        Hard
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-8 px-1 font-bold bg-green-50 hover:bg-green-100 hover:text-green-700 border-green-200 transition-colors"
                        onClick={() => handleReview(word.id, Rating.Good)}
                      >
                        Good
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-8 px-1 font-bold bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border-blue-200 transition-colors"
                        onClick={() => handleReview(word.id, Rating.Easy)}
                      >
                        Easy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Story Generation */}
      <div className="h-full overflow-y-auto pr-4 pb-8">
        {words.length > 0 ? (
          <Card className="shadow-sm border-2 border-muted overflow-visible pt-0">
            <CardHeader className="bg-muted/50 border-b py-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <BookOpen className="h-5 w-5 text-primary" />
                AI Story Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="flex flex-wrap items-end gap-4 bg-muted/20 p-4 rounded-lg border border-muted/50">
                <div className="space-y-1.5 flex-1 min-w-[180px]">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Story Level</label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="h-9 bg-background shadow-sm border-muted-foreground/20">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                        <SelectItem key={level} value={level}>
                          {level} - {level.startsWith("A") ? "Basic" : level.startsWith("B") ? "Intermediate" : "Advanced"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateStory}
                  disabled={generateStoryMutation.isPending || unreviewedCount === 0}
                  className="bg-primary hover:bg-primary/90 h-9 px-5 font-bold shadow-sm"
                >
                  {generateStoryMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <BookOpen className="mr-2 h-4 w-4" />
                  )}
                  {unreviewedCount > 0 ? `Generate (${unreviewedCount} words)` : "All Reviewed"}
                </Button>
              </div>

              {story && (
                <div className="mt-4 p-6 bg-background rounded-lg border border-muted shadow-sm prose prose-slate max-w-none overflow-visible">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: story.replace(/\n/g, "<br />")
                    }}
                    className="[&>mark]:bg-yellow-100 [&>mark]:text-yellow-900 [&>mark]:px-1 [&>mark]:py-0.5 [&>mark]:rounded [&>mark]:font-bold [&>mark]:border-b-2 [&>mark]:border-yellow-400/50 text-base md:text-lg leading-relaxed text-foreground font-sans"
                  />
                </div>
              )}

              {!story && !generateStoryMutation.isPending && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/5 rounded-lg border-2 border-dashed border-muted">
                  <BookOpen className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-base font-semibold">Your story will appear here</p>
                  <p className="text-sm opacity-70">Generate a story to practice your selected words</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full bg-muted/30 border-dashed flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-xs space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground">No words loaded</p>
              <p className="text-sm text-muted-foreground/70">
                Choose your difficulty quotas on the left and generate a word list to start.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
