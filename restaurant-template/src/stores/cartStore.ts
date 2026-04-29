import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string; name: string; price_cents: number;
  quantity: number; image_url?: string;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem,'quantity'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<CartState>()(persist((set, get) => ({
  items: [],
  add: (item, qty = 1) => set(state => {
    const existing = state.items.find(i => i.id === item.id);
    return existing
      ? { items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i) }
      : { items: [...state.items, { ...item, quantity: qty }] };
  }),
  remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  setQty: (id, qty) => set(s => ({
    items: qty <= 0 ? s.items.filter(i => i.id !== id)
      : s.items.map(i => i.id === id ? { ...i, quantity: qty } : i)
  })),
  clear: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
}), { name: 'cart-v1' }));
