import { appRouter } from "../src/server/api/root";
import { db } from "../src/server/db";

async function main() {
  const caller = appRouter.createCaller({
    db,
    // Add other context fields if needed by trpc.ts
  } as any);

  try {
    console.log("Testing generateSelection with 33% / 33% / 34% quotas...");
    const result = await caller.word.generateSelection({
      basic: 33,
      independent: 33,
      proficient: 34,
    });

    console.log(`Result count: ${result.length}`);
    if (result.length === 30) {
      console.log("SUCCESS: Got 30 words.");
    } else {
      console.log(`FAILURE: Got ${result.length} words instead of 30.`);
    }

    const cefrCounts = result.reduce((acc: any, word) => {
      acc[word.cefr] = (acc[word.cefr] || 0) + 1;
      return acc;
    }, {});
    console.log("CEFR distribution:", cefrCounts);

    // Basic (A1/A2), Independent (B1/B2), Proficient (C1/C2)
    const basicCount = (cefrCounts["A1"] || 0) + (cefrCounts["A2"] || 0);
    const independentCount = (cefrCounts["B1"] || 0) + (cefrCounts["B2"] || 0);
    const proficientCount = (cefrCounts["C1"] || 0) + (cefrCounts["C2"] || 0);

    console.log(`Basic: ${basicCount}, Independent: ${independentCount}, Proficient: ${proficientCount}`);

  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main().finally(() => process.exit());
