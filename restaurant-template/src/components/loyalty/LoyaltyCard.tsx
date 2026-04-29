import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getTier } from '../../lib/loyalty';

type LoyaltyReward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  reward_type: string;
  reward_value: number;
};

type Transaction = {
  id: string;
  points: number;
  reason: string;
  created_at: string;
};

type Props = {
  loyaltyPoints: number;
  lifetimePoints: number;
  rewards: LoyaltyReward[];
  transactions: Transaction[];
};

const TIER_COLORS: Record<string, string> = {
  Bronze: 'bg-amber-700 text-white',
  Silver: 'bg-slate-400 text-white',
  Gold: 'bg-yellow-500 text-white',
};

export default function LoyaltyCard({ loyaltyPoints, lifetimePoints, rewards, transactions }: Props) {
  const tier = getTier(lifetimePoints);

  return (
    <div className="space-y-6">
      {/* Points summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Loyalty Points</CardTitle>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${TIER_COLORS[tier]}`}>{tier}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{loyaltyPoints} pts</p>
          <p className="text-sm text-muted-foreground mt-1">{lifetimePoints} lifetime points</p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Bronze: 0+ pts · Silver: 500+ pts · Gold: 2,000+ pts</p>
          </div>
        </CardContent>
      </Card>

      {/* Available rewards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Available Rewards</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map(reward => (
            <Card key={reward.id} className={loyaltyPoints < reward.points_cost ? 'opacity-50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{reward.name}</CardTitle>
                {reward.description && <p className="text-sm text-muted-foreground">{reward.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{reward.points_cost} pts</Badge>
                  <span className="text-sm font-medium">
                    {reward.reward_type === 'discount_cents' && `$${(reward.reward_value / 100).toFixed(2)} off`}
                    {reward.reward_type === 'percent_off' && `${reward.reward_value}% off`}
                    {reward.reward_type === 'free_item' && 'Free item'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {rewards.length === 0 && (
            <p className="text-muted-foreground col-span-3">No rewards available yet.</p>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Point History</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Reason</th>
                <th className="px-4 py-3 text-left font-medium">Points</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 capitalize">{t.reason.replace(/_/g, ' ')}</td>
                  <td className={`px-4 py-3 font-mono font-medium ${t.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.points > 0 ? '+' : ''}{t.points}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No transactions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
