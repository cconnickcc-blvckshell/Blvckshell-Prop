import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(200),
  message: z.string().max(2000).optional(),
  sourcePage: z.string().max(500).optional(),
  website: z.string().max(500).optional(), // honeypot
});

export type LeadInput = z.infer<typeof leadSchema>;
