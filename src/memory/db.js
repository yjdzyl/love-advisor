/**
 * Dexie 数据库初始化
 */

import Dexie from 'dexie'

const db = new Dexie('LoveCouncil')

db.version(1).stores({
  persons: '++id, name, createdAt',
  relationships: '++id, personId, status, updatedAt',
  events: '++id, personId, date, type',
  messages: '++id, personId, role, skillId, timestamp, sessionId',
  summaries: '++id, personId, date',
  settings: '&key, value'
})

export default db
