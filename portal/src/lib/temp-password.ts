import { randomInt } from "crypto";

const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const LOWER = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";

/** 12-character password that satisfies passwordSchema (upper, lower, digit). */
export function generateTempPassword(): string {
  const alphabet = UPPER + LOWER + DIGITS;
  const chars = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)],
    ...Array.from({ length: 9 }, () => alphabet[randomInt(alphabet.length)]),
  ];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const swap = chars[i];
    chars[i] = chars[j];
    chars[j] = swap;
  }
  return chars.join("");
}
