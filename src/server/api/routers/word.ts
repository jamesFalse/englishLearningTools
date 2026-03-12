import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
        // Basic: A1, A2
        // Independent: B1, B2
        // Proficient: C1, C2

        const basicQuota = Math.round(gap * (basic / 100));
        const independentQuota = Math.round(gap * (independent / 100));
        const proficientQuota = Math.max(0, gap - basicQuota - independentQuota);

        const getNewWords = async (cefrs: string[], take: number) => {
          if (take <= 0) return [];
          return ctx.db.word.findMany({
            where: {
              state: 0,
              cefr: { in: cefrs },
            },
            take: take,
            // Add some randomness to new word selection if possible, 
            // but for now just taking the first ones is fine as per Task 3.
            // Or use a simple skip with random if we want variety.
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
});
