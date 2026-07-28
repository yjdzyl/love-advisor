import db from '../db.js'

export const summaryStore = {
  async create(data) {
    // 删除同类型旧摘要，只保留最新
    if (data.personId && data.type) {
      const old = await db.summaries
        .where({ personId: data.personId, type: data.type || 'manual' })
        .toArray()
      for (const o of old) {
        await db.summaries.delete(o.id)
      }
    }
    return db.summaries.add({
      ...data,
      date: new Date().toISOString().slice(0, 10)
    })
  },

  async get(id) {
    return db.summaries.get(id)
  },

  async getLatest(personId) {
    return db.summaries
      .where('personId').equals(personId)
      .reverse()
      .first()
  },

  async getByPerson(personId) {
    return db.summaries
      .where('personId').equals(personId)
      .reverse()
      .sortBy('date')
  },

  async delete(id) {
    return db.summaries.delete(id)
  }
}
