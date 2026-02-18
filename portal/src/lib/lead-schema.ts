import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(200),
  buildingAddress: z.string().max(300).optional(),
  propertyType: z.string().max(50).optional(),
  frequency: z.string().max(100).optional(), // e.g. "3x/week", "daily"
  callbackTime: z.string().max(100).optional(), // e.g. "Morning", "Afternoon", "Either"
  message: z.string().max(2000).optional(),
  sourcePage: z.string().max(500).optional(),
  preferredContact: z.enum(["email", "phone", "either"]).optional(),
  website: z.string().max(500).optional(), // honeypot
});

export type LeadInput = z.infer<typeof leadSchema>;
