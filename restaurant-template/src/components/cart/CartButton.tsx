import { useState } from 'react';
import { Button } from '../ui/button';
import { useCart } from '../../stores/cartStore';
import CartDrawer from './CartDrawer';

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const items = useCart(s => s.items);
  const total = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg">
        🛒 Cart {total > 0 && <span className="ml-1 rounded-full bg-white text-primary px-1.5 text-xs font-bold">{total}</span>}
      </Button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
