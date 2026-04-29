import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

type Slot = { time: string; available: number };

export default function ReservationForm() {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    party_size: 2,
    special_requests: '',
  });

  async function loadSlots(d: string) {
    setDate(d);
    setSelectedTime('');
    if (!d) return;
    const res = await fetch(`/api/reservations?date=${d}`);
    if (res.ok) setSlots(await res.json() as Slot[]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime) { setError('Please select a time slot'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, reservation_time: selectedTime }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to book');
      }
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold">Reservation Confirmed!</h2>
        <p className="text-muted-foreground mt-2">We'll see you on {new Date(selectedTime).toLocaleString()}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-lg">
      <div>
        <Label>Date</Label>
        <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => loadSlots(e.target.value)} required />
      </div>

      {slots.length > 0 && (
        <div>
          <Label>Time Slot</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {slots.map(slot => (
              <Button
                key={slot.time}
                type="button"
                size="sm"
                variant={selectedTime === slot.time ? 'default' : 'outline'}
                disabled={slot.available <= 0}
                onClick={() => setSelectedTime(slot.time)}
              >
                {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {slot.available <= 0 && ' Full'}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.guest_email} onChange={e => setForm({ ...form, guest_email: e.target.value })} required />
        </div>
        <div>
          <Label>Phone</Label>
          <Input type="tel" value={form.guest_phone} onChange={e => setForm({ ...form, guest_phone: e.target.value })} required />
        </div>
        <div>
          <Label>Party Size</Label>
          <Input type="number" min={1} max={20} value={form.party_size} onChange={e => setForm({ ...form, party_size: Number(e.target.value) })} required />
        </div>
      </div>

      <div>
        <Label>Special Requests</Label>
        <Textarea value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} placeholder="Any dietary restrictions, celebrations, etc." />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Booking…' : 'Book Table'}
      </Button>
    </form>
  );
}
