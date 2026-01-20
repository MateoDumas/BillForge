import { z } from "zod";

export const createSubscriptionSchema = z.object({
  body: z.object({
    planId: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Invalid plan ID format" }),
  }),
});

export const cancelSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, { message: "Invalid subscription ID format" }),
  }),
});
