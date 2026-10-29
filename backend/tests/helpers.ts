import { createApp } from "../src/app.js";
import { openMemoryDatabase, type Db } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";

export function createTestDb(): Db {
  const db = openMemoryDatabase();
  seedDatabase(db);
  return db;
}

export function createTestApp(db: Db = createTestDb()) {
  return { app: createApp(db), db };
}
