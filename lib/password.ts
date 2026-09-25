/** Letters and digits without look-alikes (0/O, 1/l/I), so a password can be read out or typed from a screen. */
export const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const GENERATED_PASSWORD_LENGTH = 10;
/** Shared by the forms and the API schemas, so client and server always agree. */
export const MIN_PASSWORD_LENGTH = 8;
/** Supabase (bcrypt) ignores anything past 72 bytes. */
export const MAX_PASSWORD_LENGTH = 72;

// Bytes at or above this value are skipped so every character is equally likely.
const UNBIASED_LIMIT = 256 - (256 % PASSWORD_ALPHABET.length);

/** A random password from a cryptographic source; works in the browser and on the server. */
export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
  const chars = Array.from(bytes)
    .filter((b) => b < UNBIASED_LIMIT)
    .map((b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]);
  // Rarely too many bytes are skipped; draw again rather than return a short password.
  return chars.length >= length ? chars.slice(0, length).join("") : generatePassword(length);
}
