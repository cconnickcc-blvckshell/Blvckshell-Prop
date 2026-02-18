import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional(),
  role: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(200),
  propertyType: z.string().max(50).optional(),
  sitesCount: z.number().int().min(0).optional(),
  message: z.string().max(2000).optional(),
  sourcePage: z.string().max(500).optional(),
  preferredContact: z.enum(["email", "phone", "either"]).optional(),
  website: z.string().max(500).optional(), // honeypot
});

export type LeadInput = z.infer<typeof leadSchema>;
