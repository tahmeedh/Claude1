import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

type Reservation = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  reservation_time: string;
  status: string;
  table_number: number | null;
  special_requests: string | null;
};

type Props = { initialReservations: Reservation[] };

const STATUS_OPTIONS = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];

export default function ReservationsCalendar({ initialReservations }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [tableInput, setTableInput] = useState('');

  async function updateReservation(id: string, patch: Partial<Reservation>) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json() as Reservation;
      setReservations(prev => prev.map(r => r.id === id ? updated : r));
      if (selected?.id === id) setSelected(updated);
    }
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Guest</th>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Party</th>
              <th className="px-4 py-3 text-left font-medium">Table</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.map(r => (
              <tr
                key={r.id}
                className={`cursor-pointer hover:bg-muted/30 ${selected?.id === r.id ? 'bg-muted/50' : ''}`}
                onClick={() => { setSelected(r); setTableInput(String(r.table_number ?? '')); }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{r.guest_name}</div>
                  <div className="text-xs text-muted-foreground">{r.guest_email}</div>
                </td>
                <td className="px-4 py-3">{new Date(r.reservation_time).toLocaleString()}</td>
                <td className="px-4 py-3">{r.party_size}</td>
                <td className="px-4 py-3">{r.table_number ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.status === 'confirmed' ? 'default' : r.status === 'cancelled' || r.status === 'no_show' ? 'destructive' : 'secondary'}>
                    {r.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No reservations</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="w-72 rounded-md border p-4 space-y-4">
          <h3 className="font-semibold">{selected.guest_name}</h3>
          <p className="text-sm text-muted-foreground">{selected.guest_email}</p>
          {selected.guest_phone && <p className="text-sm">{selected.guest_phone}</p>}
          {selected.special_requests && (
            <p className="text-sm bg-muted/50 rounded p-2">{selected.special_requests}</p>
          )}

          <div>
            <label className="text-xs font-medium">Table #</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={tableInput}
                onChange={e => setTableInput(e.target.value)}
              />
              <Button size="sm" onClick={() => updateReservation(selected.id, { table_number: Number(tableInput) })}>
                Set
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Status</label>
            <div className="flex flex-col gap-1 mt-1">
              {STATUS_OPTIONS.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={selected.status === s ? 'default' : 'outline'}
                  onClick={() => updateReservation(selected.id, { status: s as Reservation['status'] })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
