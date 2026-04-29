import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { useCart } from '../../stores/cartStore';

type Props = { open: boolean; onClose: () => void };

export default function CartDrawer({ open, onClose }: Props) {
  const { items, remove, setQty, subtotal, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkout() {
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          fulfillment,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json() as { url: string };
      clear();
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const tax = Math.round(subtotal() * 0.0875);
  const total = subtotal() + tax;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">${(item.price_cents / 100).toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-6 w-6 text-xs" onClick={() => setQty(item.id, item.quantity - 1)}>−</Button>
                  <span className="w-4 text-center text-sm">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-6 w-6 text-xs" onClick={() => setQty(item.id, item.quantity + 1)}>+</Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-xs text-destructive" onClick={() => remove(item.id)}>✕</Button>
                </div>
                <p className="w-16 text-right text-sm">${((item.price_cents * item.quantity) / 100).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>${(subtotal() / 100).toFixed(2)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Tax (8.75%)</span><span>${(tax / 100).toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>${(total / 100).toFixed(2)}</span></div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant={fulfillment === 'pickup' ? 'default' : 'outline'} onClick={() => setFulfillment('pickup')} className="flex-1">Pickup</Button>
              <Button size="sm" variant={fulfillment === 'delivery' ? 'default' : 'outline'} onClick={() => setFulfillment('delivery')} className="flex-1">Delivery</Button>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button className="w-full" onClick={checkout} disabled={loading}>
              {loading ? 'Redirecting…' : 'Checkout'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
