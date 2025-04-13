
import { defaultTimeZone } from './timezone-list';
import { getCurrentTimezone, getLocalTimezoneOffset, getTimezone } from './timezone';

export interface ClientTimeZone {
  id: string;
  offset: number;
  offsetName: string;
}

export const createClientTimeZone = (serverTimeZone: Partial<{ timeZone: number; timeZoneId: string }>): ClientTimeZone => (
  (!serverTimeZone.timeZoneId || serverTimeZone.timeZoneId === defaultTimeZone)
    ? getTimezone()
    : getTimezone(getLocalTimezoneOffset(), serverTimeZone.timeZoneId)
);

export const getServerTimeZone = (timeZone: ClientTimeZone): { timeZone: number; timeZoneId: string; } => ({
  timeZone: timeZone?.offset ?? getCurrentTimezone().offset,
  timeZoneId: timeZone?.id ?? getCurrentTimezone().id,
});

export class EssentialSettings {
  constructor(
    public locale: Intl.Locale,
    public timeZone: ClientTimeZone,
  ) {}
}
