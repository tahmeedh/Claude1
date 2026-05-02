import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

type Slot = { time: string; available: number };

export default function ReservationForm() {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
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
    setSlots([]);
    if (!d) return;
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/reservations?date=${d}`);
      if (res.ok) setSlots(await res.json() as Slot[]);
    } catch {
      // silently ignore — slots just won't show
    } finally {
      setSlotsLoading(false);
    }
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
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a3050' }}>Reservation Confirmed!</h2>
        <p className="text-muted-foreground mb-1">We'll see you on</p>
        <p className="text-lg font-semibold" style={{ color: '#5a80b0' }}>
          {new Date(selectedTime).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long',
            day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">A confirmation email is on its way to <strong>{form.guest_email}</strong>.</p>
        <button
          onClick={() => { setSuccess(false); setDate(''); setSlots([]); setSelectedTime(''); setForm({ guest_name: '', guest_email: '', guest_phone: '', party_size: 2, special_requests: '' }); }}
          className="mt-6 text-sm text-primary font-medium hover:underline"
        >
          Make another reservation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">

      {/* Date picker */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <Label className="text-base font-semibold mb-3 block" style={{ color: '#1a3050' }}>
          📅 Select a date
        </Label>
        <Input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={e => loadSlots(e.target.value)}
          required
          className="max-w-xs"
        />
      </div>

      {/* Time slots */}
      {(slotsLoading || slots.length > 0) && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <Label className="text-base font-semibold mb-3 block" style={{ color: '#1a3050' }}>
            🕐 Select a time
          </Label>
          {slotsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading availability…
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => {
                const isSelected = selectedTime === slot.time;
                const isFull = slot.available <= 0;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedTime(slot.time)}
                    className={[
                      'relative rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150',
                      'border-2 focus:outline-none focus:ring-2 focus:ring-offset-1',
                      isFull
                        ? 'border-muted bg-muted/40 text-muted-foreground cursor-not-allowed opacity-50'
                        : isSelected
                          ? 'border-transparent text-white shadow-md scale-105'
                          : 'border-border bg-white text-foreground hover:border-primary/50 hover:bg-primary/5 hover:scale-[1.02]',
                    ].join(' ')}
                    style={isSelected ? {
                      background: 'linear-gradient(135deg, #5ab4f0 0%, #3a8fd0 100%)',
                      boxShadow: '0 4px 12px rgba(58,143,208,0.4)',
                    } : {}}
                  >
                    {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-green-400 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold">✓</span>
                    )}
                    {isFull && <div className="text-[10px] leading-tight opacity-70">Full</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest details */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <Label className="text-base font-semibold mb-1 block" style={{ color: '#1a3050' }}>
          👤 Your details
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Full name</Label>
            <Input value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} placeholder="Jane Smith" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.guest_email} onChange={e => setForm({ ...form, guest_email: e.target.value })} placeholder="jane@example.com" required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input type="tel" value={form.guest_phone} onChange={e => setForm({ ...form, guest_phone: e.target.value })} placeholder="+1 555 000 0000" required />
          </div>
          <div>
            <Label>Party size</Label>
            <Input type="number" min={1} max={20} value={form.party_size} onChange={e => setForm({ ...form, party_size: Number(e.target.value) })} required />
          </div>
        </div>
        <div>
          <Label>Special requests</Label>
          <Textarea
            value={form.special_requests}
            onChange={e => setForm({ ...form, special_requests: e.target.value })}
            placeholder="Dietary restrictions, celebrations, accessibility needs…"
            rows={3}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/20">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !selectedTime}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Booking your table…
          </span>
        ) : (
          `📅 Book Table${selectedTime ? ` at ${new Date(selectedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`
        )}
      </Button>
    </form>
  );
}
