import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabaseBrowser } from '../../lib/supabase/browser';
import { getTier } from '../../lib/loyalty';

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  loyalty_points: number;
  lifetime_points: number;
};

type Props = { topCustomers: Profile[] };

export default function LoyaltyOverview({ topCustomers }: Props) {
  const [customers, setCustomers] = useState<Profile[]>(topCustomers);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function applyAdjustment() {
    if (!adjustUserId || !adjustPoints) return;
    setSaving(true);
    await supabaseBrowser.rpc('apply_loyalty_points', {
      p_user_id: adjustUserId,
      p_points: Number(adjustPoints),
      p_order_id: null,
      p_reason: adjustReason || 'manual_adjustment',
    });
    // Refresh customer list
    const { data } = await supabaseBrowser
      .from('profiles')
      .select('id,email,full_name,loyalty_points,lifetime_points')
      .order('lifetime_points', { ascending: false })
      .limit(20);
    if (data) setCustomers(data as Profile[]);
    setAdjustUserId('');
    setAdjustPoints('');
    setAdjustReason('');
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Tier</th>
              <th className="px-4 py-3 text-left font-medium">Current Points</th>
              <th className="px-4 py-3 text-left font-medium">Lifetime Points</th>
              <th className="px-4 py-3 text-left font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.full_name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{getTier(c.lifetime_points)}</Badge>
                </td>
                <td className="px-4 py-3 font-mono">{c.loyalty_points}</td>
                <td className="px-4 py-3 font-mono">{c.lifetime_points}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => setAdjustUserId(c.id)}>
                    Adjust
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adjustUserId && (
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="font-semibold">Manual Point Adjustment</h3>
          <p className="text-sm text-muted-foreground">User: {customers.find(c => c.id === adjustUserId)?.email}</p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Points (use - to deduct)"
              value={adjustPoints}
              onChange={e => setAdjustPoints(e.target.value)}
            />
            <Input
              placeholder="Reason"
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
            />
            <Button onClick={applyAdjustment} disabled={saving}>
              {saving ? 'Saving…' : 'Apply'}
            </Button>
            <Button variant="outline" onClick={() => setAdjustUserId('')}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
