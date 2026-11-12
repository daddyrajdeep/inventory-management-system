// Same rule as the server (utils/passwordRule.js): 8+ characters with a letter and a number.
export function passwordError(value, label = 'Password') {
  if (value.length < 8) return `${label} must be at least 8 characters`;
  if (!/[A-Za-z]/.test(value)) return `${label} must contain a letter`;
  if (!/\d/.test(value)) return `${label} must contain a number`;
  return null;
}
