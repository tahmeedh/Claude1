import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { supabaseBrowser } from '../../lib/supabase/browser';

type Order = {
  id: string;
  status: string;
  fulfillment: string;
  total_cents: number;
  guest_email: string | null;
  guest_name: string | null;
  created_at: string;
  points_earned: number | null;
};

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  preparing: 'default',
  ready: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  refunded: 'destructive',
};

const STATUSES = ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'];

type Props = { initialOrders: Order[] };

export default function OrdersTable({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, []);

  async function updateStatus(orderId: string, status: string) {
    await supabaseBrowser.from('orders').update({ status }).eq('id', orderId);
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Order</th>
            <th className="px-4 py-3 text-left font-medium">Customer</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Total</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map(order => (
            <tr key={order.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
              <td className="px-4 py-3">{order.guest_name ?? order.guest_email ?? '—'}</td>
              <td className="px-4 py-3 capitalize">{order.fulfillment}</td>
              <td className="px-4 py-3">${(order.total_cents / 100).toFixed(2)}</td>
              <td className="px-4 py-3">
                <select
                  className="rounded border px-2 py-1 text-xs"
                  value={order.status}
                  onChange={e => updateStatus(order.id, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(order.created_at).toLocaleTimeString()}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No orders yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
