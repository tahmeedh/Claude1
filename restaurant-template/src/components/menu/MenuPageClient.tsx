import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useCart } from '../../stores/cartStore';

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  dietary_tags: string[];
  category_id: string | null;
};

type Category = { id: string; name: string };
type Props = { items: MenuItem[]; categories: Category[] };

export default function MenuPageClient({ items, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const { items: cartItems, add, remove, setQty, subtotal, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const totalQty = cartItems.reduce((s, i) => s + i.quantity, 0);

  const filtered = activeCategory
    ? items.filter(i => i.category_id === activeCategory)
    : items;

  function handleAdd(item: MenuItem) {
    add({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url ?? undefined });
    setAddedIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [item.id]: false })), 1500);
  }

  async function checkout() {
    if (cartItems.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(i => ({ id: i.id, quantity: i.quantity })),
          fulfillment,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json() as { url: string };
      clear();
      window.location.href = url;
    } catch (e) {
      setCheckoutError((e as Error).message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const tax = Math.round(subtotal() * 0.0875);
  const total = subtotal() + tax;

  return (
    <>
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          size="sm"
          variant={activeCategory === null ? 'default' : 'outline'}
          onClick={() => setActiveCategory(null)}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            size="sm"
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(item => (
          <Card key={item.id} className="overflow-hidden">
            {item.image_url && (
              <img src={item.image_url} alt={item.name} className="h-48 w-full object-cover" loading="lazy" />
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.name}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold">${(item.price_cents / 100).toFixed(2)}</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.dietary_tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={addedIds[item.id] ? 'outline' : 'default'}
                  className={`min-w-[72px] transition-all ${addedIds[item.id] ? 'border-green-500 text-green-600' : ''}`}
                  onClick={() => handleAdd(item)}
                >
                  {addedIds[item.id] ? '✓ Added' : 'Add'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating cart button */}
      <Button
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg gap-2"
      >
        🛒 Cart
        {totalQty > 0 && (
          <span className="rounded-full bg-white text-primary px-1.5 text-xs font-bold leading-tight">
            {totalQty}
          </span>
        )}
      </Button>

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={v => setCartOpen(v)}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-4xl">🛒</p>
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add items from the menu to get started.</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${(item.price_cents / 100).toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="icon" variant="outline" className="h-7 w-7 text-xs" onClick={() => setQty(item.id, item.quantity - 1)}>−</Button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 text-xs" onClick={() => setQty(item.id, item.quantity + 1)}>+</Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-xs text-destructive hover:text-destructive" onClick={() => remove(item.id)}>✕</Button>
                  </div>
                  <p className="w-14 text-right text-sm font-medium">${((item.price_cents * item.quantity) / 100).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${(subtotal() / 100).toFixed(2)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax (8.75%)</span><span>${(tax / 100).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t"><span>Total</span><span>${(total / 100).toFixed(2)}</span></div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant={fulfillment === 'pickup' ? 'default' : 'outline'} onClick={() => setFulfillment('pickup')} className="flex-1">Pickup</Button>
                <Button size="sm" variant={fulfillment === 'delivery' ? 'default' : 'outline'} onClick={() => setFulfillment('delivery')} className="flex-1">Delivery</Button>
              </div>

              {checkoutError && <p className="text-xs text-destructive bg-destructive/10 rounded p-2">{checkoutError}</p>}
              <Button className="w-full" onClick={checkout} disabled={checkoutLoading} size="lg">
                {checkoutLoading ? 'Redirecting…' : 'Checkout →'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
