/**
 * 消息存储
 */

import db from '../db.js'

export const messageStore = {
  async save({ role, content, skillId, personId = null, sessionId = null }) {
    const id = await db.messages.add({
      role,
      content,
      skillId,
      personId,
      sessionId,
      timestamp: Date.now()
    })
    return id
  },

  async getByPerson(personId, { page = 1, pageSize = 50 } = {}) {
    const offset = (page - 1) * pageSize
    const total = await db.messages
      .where('personId').equals(personId)
      .count()
    const items = await db.messages
      .where('personId').equals(personId)
      .reverse()
      .offset(offset)
      .limit(pageSize)
      .toArray()
    return { items: items.reverse(), total }
  },

  async getBySession(sessionId) {
    return db.messages
      .where('sessionId').equals(sessionId)
      .sortBy('timestamp')
  },

  async getAll({ page = 1, pageSize = 50 } = {}) {
    const offset = (page - 1) * pageSize
    const total = await db.messages.count()
    const items = await db.messages
      .orderBy('timestamp')
      .reverse()
      .offset(offset)
      .limit(pageSize)
      .toArray()
    return { items: items.reverse(), total }
  },

  async clearPerson(personId) {
    await db.messages.where('personId').equals(personId).delete()
  },

  async clearAll() {
    await db.messages.clear()
  }
}
