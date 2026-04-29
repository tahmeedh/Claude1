import { z } from 'zod';

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CheckoutBodySchema = z.object({
  items: z.array(CartItemSchema).min(1),
  fulfillment: z.enum(['pickup', 'delivery']),
  guest: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(7),
  }).optional(),
  redeemRewardId: z.string().uuid().optional(),
});

export const ReservationBodySchema = z.object({
  guest_name: z.string().min(1),
  guest_email: z.string().email(),
  guest_phone: z.string().min(7),
  party_size: z.number().int().min(1).max(20),
  reservation_time: z.string().datetime(),
  special_requests: z.string().max(500).optional(),
});

export const MenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_cents: z.number().int().min(0),
  category_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  dietary_tags: z.array(z.string()).optional(),
});

export type CheckoutBody = z.infer<typeof CheckoutBodySchema>;
export type ReservationBody = z.infer<typeof ReservationBodySchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
