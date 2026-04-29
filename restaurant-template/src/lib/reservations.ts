import { addMinutes, isBefore } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

export const RESTAURANT_HOURS = {
  // 0=Sun .. 6=Sat
  0: { open: '11:00', close: '21:00' },
  1: { open: '11:00', close: '22:00' },
  2: { open: '11:00', close: '22:00' },
  3: { open: '11:00', close: '22:00' },
  4: { open: '11:00', close: '23:00' },
  5: { open: '11:00', close: '23:00' },
  6: { open: '11:00', close: '23:00' },
} as const;

export const TOTAL_TABLES = 15;
export const SLOT_MINUTES = 30;
export const RESERVATION_DURATION = 90;

export function generateSlots(date: Date, tz: string): Date[] {
  const day = date.getDay() as keyof typeof RESTAURANT_HOURS;
  const hours = RESTAURANT_HOURS[day];
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  const slots: Date[] = [];
  const start = new Date(date); start.setHours(oh, om, 0, 0);
  const end = new Date(date); end.setHours(ch - 1, cm, 0, 0); // last seating 1h before close

  for (let t = start; isBefore(t, end); t = addMinutes(t, SLOT_MINUTES))
    slots.push(fromZonedTime(t, tz));
  return slots;
}

export async function getAvailableTables(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, time: Date, _partySize: number
): Promise<number> {
  const windowStart = addMinutes(time, -RESERVATION_DURATION + 1);
  const windowEnd = addMinutes(time, RESERVATION_DURATION - 1);
  const { data } = await supabase
    .from('reservations')
    .select('party_size')
    .gte('reservation_time', windowStart.toISOString())
    .lte('reservation_time', windowEnd.toISOString())
    .in('status', ['pending','confirmed','seated']);
  const used = data?.length ?? 0;
  return Math.max(0, TOTAL_TABLES - used);
}
