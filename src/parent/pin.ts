export interface StoredPin {
  salt: string;
  hash: string;
}

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function digest(salt: string, pin: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin)));
}

export async function hashPin(pin: string): Promise<StoredPin> {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return { salt, hash: await digest(salt, pin) };
}

export async function verifyPin(pin: string, stored: StoredPin): Promise<boolean> {
  return (await digest(stored.salt, pin)) === stored.hash;
}
