import { openDB } from 'idb'

const DB_NAME = 'dropify-db'
const STORE_NAME = 'drops'

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

export async function saveDrops(sessionCode: string, drops: any[]) {
  const db = await getDB()
  await db.put(STORE_NAME, drops, sessionCode)
}

export async function loadDrops(sessionCode: string) {
  const db = await getDB()
  return db.get(STORE_NAME, sessionCode)
}
