import db from '../db.js'

export const personStore = {
  async create(data) {
    return db.persons.add({
      ...data,
      createdAt: new Date().toISOString().slice(0, 10)
    })
  },

  async get(id) {
    return db.persons.get(id)
  },

  async getAll() {
    return db.persons.orderBy('name').toArray()
  },

  async update(id, data) {
    return db.persons.update(id, data)
  },

  async delete(id) {
    await db.transaction('rw', db.persons, db.relationships, db.events, db.messages, db.summaries, async () => {
      await db.persons.delete(id)
      await db.relationships.where('personId').equals(id).delete()
      await db.events.where('personId').equals(id).delete()
      await db.messages.where('personId').equals(id).delete()
      await db.summaries.where('personId').equals(id).delete()
    })
  },

  async search(query) {
    const all = await db.persons.toArray()
    return all.filter(p => p.name.includes(query))
  }
}
