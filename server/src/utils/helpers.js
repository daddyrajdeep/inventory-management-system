// Small helpers shared by the controllers.

// A real MongoDB id is exactly 24 hex characters
export const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

// Makes user text safe to put inside a regular expression (for search boxes)
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive exact match for a name:  Category.findOne({ name: exactName('electronics') })
export const exactName = (name) => new RegExp(`^${escapeRegex(String(name).trim())}$`, 'i');

// Keeps only the listed fields of an object (stops people sending fields like "quantity" or "role")
export const pick = (obj, fields) =>
  Object.fromEntries(fields.filter((f) => obj[f] !== undefined).map((f) => [f, obj[f]]));

// Reads ?limit=  with a default and a maximum
export const parseLimit = (value, fallback = 200, max = 1000) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback;
};

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
