import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { GoogleGenAI } from '@google/genai';
import { env } from "~/env";
import { fsrs, Rating, createEmptyCard, type Grade } from "ts-fsrs";

export const wordRouter = createTRPCRouter({
  generateSelection: publicProcedure
    .input(
      z.object({
        basic: z.number().min(0).max(100),
        independent: z.number().min(0).max(100),
        proficient: z.number().min(0).max(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const { basic, independent, proficient } = input;
      const now = new Date();

      // 1. Query Due Words (due <= now, state > 0)
      const dueWords = await ctx.db.word.findMany({
        where: {
          due: { lte: now },
          state: { gt: 0 },
        },
      });

      const limit = 30;
      let selection = [...dueWords];

      if (selection.length < limit) {
        const gap = limit - selection.length;

        // 2. Query New Words (state = 0) based on CEFR quotas
        const basicQuota = Math.round(gap * (basic / 100));
        const independentQuota = Math.round(gap * (independent / 100));
        const proficientQuota = Math.max(0, gap - basicQuota - independentQuota);

        const getNewWords = async (cefrs: string[], take: number) => {
          if (take <= 0) return [];

          // 1. Count total available words in these categories
          const count = await ctx.db.word.count({
            where: {
              state: 0,
              cefr: { in: cefrs },
            },
          });

          if (count === 0) return [];

          // 2. Pick a random offset
          const skip = Math.max(0, Math.floor(Math.random() * (count - take)));

          return ctx.db.word.findMany({
            where: {
              state: 0,
              cefr: { in: cefrs },
            },
            take: take,
            skip: skip,
          });
        };

        const [newBasic, newIndependent, newProficient] = await Promise.all([
          getNewWords(["A1", "A2"], basicQuota),
          getNewWords(["B1", "B2"], independentQuota),
          getNewWords(["C1", "C2"], proficientQuota),
        ]);

        selection = [...selection, ...newBasic, ...newIndependent, ...newProficient];
      }

      // 3. Shuffle and limit to 30
      const shuffled = selection
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      return shuffled;
    }),

  generateStory: publicProcedure
    .input(
      z.object({
        words: z.array(z.string()),
        difficulty: z.string(), // A1, A2, B1, B2, C1, C2
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { words, difficulty } = input;
        const GEMINI_API_KEY = env.GEMINI_API_KEY;

        const ai = new GoogleGenAI({
          apiKey: GEMINI_API_KEY,
        });

        const wordCount = words.length;
        const targetLength = Math.max(50, wordCount * 12); // Minimum 50 words, or 12 words per target vocabulary

        const prompt = `Write a short story at English level ${difficulty} using ALL of the following ${wordCount} words: ${words.join(", ")}. 
        
        CRITICAL CONSTRAINTS:
        1. Every time you use one of the ${wordCount} words, wrap it in <mark> tags (e.g., <mark>word</mark>). 
        2. The story must be approximately ${targetLength} words long. (Adjusted for the number of target words).
        3. The story should be coherent, engaging, and suitable for a ${difficulty} learner.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview', 
          contents: prompt,
        });

        return response.text;
      } catch (error: any) {
        console.error("Gemini Story Generation Error:", error);
        throw new Error(`Failed to generate story with Gemini: ${error.message || "Unknown error"}`);
      }
    }),

  submitReview: publicProcedure
    .input(
      z.object({
        wordId: z.number(),
        rating: z.nativeEnum(Rating), // 1:Again, 2:Hard, 3:Good, 4:Easy
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { wordId, rating } = input;
      const word = await ctx.db.word.findUnique({ where: { id: wordId } });
      if (!word) throw new Error("Word not found");

      const f = fsrs();
      const card = createEmptyCard(); // Initialize with default FSRS card properties

      // Assign existing word data to the card
      card.due = word.due ?? new Date();
      card.stability = word.stability;
      card.difficulty = word.difficulty;
      card.scheduled_days = word.scheduled_days;
      card.reps = word.reps;
      card.lapses = word.lapses;
      card.state = word.state;
      card.last_review = word.last_review ?? undefined;

      const schedulingCards = f.repeat(card, new Date());
      const { card: updatedCard } = schedulingCards[rating as Grade]!;

      return ctx.db.word.update({
        where: { id: wordId },
        data: {
          due: updatedCard.due,
          stability: updatedCard.stability,
          difficulty: updatedCard.difficulty,
          elapsed_days: updatedCard.elapsed_days,
          scheduled_days: updatedCard.scheduled_days,
          reps: updatedCard.reps,
          lapses: updatedCard.lapses,
          state: updatedCard.state,
          last_review: updatedCard.last_review,
        },
      });
    }),
});
