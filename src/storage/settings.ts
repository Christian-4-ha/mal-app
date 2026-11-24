import { db } from './db';

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await (await db()).get('settings', key)) as T | undefined;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await (await db()).put('settings', value, key);
}

export async function deleteSetting(key: string): Promise<void> {
  await (await db()).delete('settings', key);
}
