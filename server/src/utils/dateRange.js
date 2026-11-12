import ApiError from './ApiError.js';

// The business runs in India, so "a day" means an IST day (UTC+05:30, no daylight saving).
export const TZ = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 366;

// Midnight (IST) at the start of the day that contains `date`
const startOfDayIST = (date) => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
};

// str is "YYYY-MM-DD". Rejects impossible dates like 2026-02-31 instead of letting them roll over.
const parseDay = (str) => {
  const date = new Date(`${str}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime()) || new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10) !== str) {
    throw new ApiError(400, `Invalid date: ${str}`);
  }
  return date;
};

// Reads the date range from the query string:
//   ?from=2026-11-01&to=2026-11-30   (both inclusive)   or   ?days=30  (default, ends today)
// Returns { start, end } where end is EXCLUSIVE, so query with  { $gte: start, $lt: end }
export function getRange(query) {
  let start;
  let end;

  if (query.from || query.to) {
    end = query.to ? new Date(parseDay(query.to).getTime() + DAY_MS) : new Date(startOfDayIST(new Date()).getTime() + DAY_MS);
    start = query.from ? parseDay(query.from) : new Date(end.getTime() - 30 * DAY_MS);
  } else {
    const days = Number(query.days) || 30;
    end = new Date(startOfDayIST(new Date()).getTime() + DAY_MS); // end of today
    start = new Date(end.getTime() - days * DAY_MS);
  }

  if (start >= end) throw new ApiError(400, '"from" must be before "to"');
  if ((end - start) / DAY_MS > MAX_DAYS) throw new ApiError(400, `Date range cannot be longer than ${MAX_DAYS} days`);
  return { start, end };
}

// The period of the same length right before this one (used for "vs last period" changes)
export const previousRange = ({ start, end }) => ({ start: new Date(start.getTime() - (end - start)), end: start });

// Every IST date string ("2026-11-12") inside the range, so charts have no gaps
export function eachDay({ start, end }) {
  const days = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    days.push(new Date(t + IST_OFFSET_MS).toISOString().slice(0, 10));
  }
  return days;
}

// For list pages (sales, expenses): returns { start, end } when ?from= and/or ?to= is given, otherwise null (no date filter).
export function optionalRange(query) {
  if (!query.from && !query.to) return null;
  const from = query.from ? parseDay(query.from) : new Date(0);
  const to = query.to ? new Date(parseDay(query.to).getTime() + DAY_MS) : new Date(8640000000000000);
  if (from >= to) throw new ApiError(400, '"from" must be before "to"');
  return { start: from, end: to };
}
