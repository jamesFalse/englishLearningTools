import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { callGemini } from "~/server/lib/gemini";
import { env } from "~/env";

export interface GrammarIssue {
  id: string;
  offset: number;
  length: number;
  original: string;
  replacement: string;
  type: "grammar" | "spelling" | "style";
  message: string;
}

export interface GrammarStats {
  grammar: number;
  spelling: number;
  style: number;
  total: number;
}

export interface GrammarCheckResult {
  text: string;
  issues: GrammarIssue[];
  stats: GrammarStats;
}

const GRAMMAR_SYSTEM_PROMPT = `
Analyze English text for grammar, spelling, and style errors, especially for English learners (CEFR A1-B2). 
Return a JSON object containing an array of issues and a summary of stats.

EXACT JSON structure:
{
  "issues": [
    {
      "offset": number,
      "length": number,
      "original": "string",
      "replacement": "string",
      "type": "grammar" | "spelling" | "style",
      "message": "string"
    }
  ],
  "stats": {
    "grammar": number,
    "spelling": number,
    "style": number,
    "total": number
  }
}
If no issues, issues array must be empty and stats all 0.
`;

const calculateStats = (issues: GrammarIssue[]): GrammarStats => {
  return {
    grammar: issues.filter(i => i.type === "grammar").length,
    spelling: issues.filter(i => i.type === "spelling").length,
    style: issues.filter(i => i.type === "style").length,
    total: issues.length,
  };
};

export const grammarRouter = createTRPCRouter({
  getSettings: publicProcedure.query(() => {
    return {
      runningEnv: env.RUNNING_ENV,
    };
  }),

  verifyPasskey: publicProcedure
    .input(z.object({ passkey: z.string() }))
    .mutation(async ({ input }) => {
      const isValid = input.passkey === env.PASSKEY;
      if (!isValid) {
        // 验证失败，强制延迟 2 秒，增加暴力破解成本
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      return isValid;
    }),

  check: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        mode: z.enum(["online", "offline"]),
      })
    )
    .mutation(async ({ input }): Promise<GrammarCheckResult> => {
      const { text, mode } = input;

      if (mode === "offline") {
        try {
          // 直接调用本地 LanguageTool HTTP API
          const response = await fetch("http://localhost:8081/v2/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              text: text,
              language: "en-US",
            }),
          });

          if (!response.ok) {
            throw new Error(`LanguageTool server responded with ${response.status}`);
          }

          const data = await response.json();
          
          const issues: GrammarIssue[] = data.matches.map((m: any, idx: number) => ({
            id: `lt-${idx}`,
            offset: m.offset,
            length: m.length,
            original: text.substring(m.offset, m.offset + m.length),
            replacement: m.replacements?.[0]?.value || "",
            type: m.rule.issueType === "misspelling" ? "spelling" : "grammar",
            message: m.message,
          }));

          return { 
            text, 
            issues, 
            stats: calculateStats(issues) 
          };
        } catch (err) {
          console.error("Offline Check Error:", err);
          throw new Error("离线纠错引擎未就绪，请启动 LanguageTool 本地服务 (port 8081)");
        }
      } else {
        const result = await callGemini(`TEXT: "${text}"`, {
          systemInstruction: GRAMMAR_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        });

        const issues: GrammarIssue[] = (result.issues || []).map((issue: any, index: number) => ({
          ...issue,
          id: `online-${index}`,
        }));

        return {
          text,
          issues,
          stats: result.stats || { grammar: 0, spelling: 0, style: 0, total: 0 },
        };
      }
    }),
});
