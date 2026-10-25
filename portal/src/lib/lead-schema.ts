import { z } from "zod";
import { ALLOWED_SERVICE_INTERESTS, type ServiceInterestId } from "@/config/marketing-site";

export const leadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email").max(200),
  city: z.string().max(120).optional(),
  propertyType: z.string().max(120).optional(),
  serviceInterest: z
    .string()
    .max(64)
    .optional()
    .refine(
      (val) => !val || ALLOWED_SERVICE_INTERESTS.includes(val as ServiceInterestId),
      { message: "Invalid service selection" }
    ),
  sitesCount: z.coerce.number().int().min(0).max(10000).optional(),
  preferredContact: z.enum(["email", "phone", "either"]).optional(),
  message: z.string().max(2000).optional(),
  sourcePage: z.string().max(500).optional(),
  website: z.string().max(500).optional(), // honeypot
});

export type LeadInput = z.infer<typeof leadSchema>;
