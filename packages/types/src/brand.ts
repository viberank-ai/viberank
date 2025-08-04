import { z } from 'zod';

export const BrandSchema = z.object({
  name: z.string(),
  altSpellings: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
});

export type Brand = z.infer<typeof BrandSchema>;
