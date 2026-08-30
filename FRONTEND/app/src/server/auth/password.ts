import "server-only";

import { hash, verify, type Options } from "@node-rs/argon2";

const passwordOptions: Options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export function hashPassword(password: string) {
  return hash(password, passwordOptions);
}

export function verifyPassword(password: string, passwordHash: string) {
  return verify(passwordHash, password, passwordOptions);
}
