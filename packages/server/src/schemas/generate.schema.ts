import { z } from "zod";

export const GenerateSchema = z.object({
  components: z.array(
    z.object({
      name: z.string(),
      usage: z.string()
    })
  ),
  explanation: z.string(),
  code: z.string()
})
  .passthrough()
  .transform(({ components, explanation, code }) => ({ components, explanation, code }));
