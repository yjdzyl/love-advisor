import db from '../db.js'

export const eventStore = {
  async create(data) {
    return db.events.add(data)
  },

  async get(id) {
    return db.events.get(id)
  },

  async getByPerson(personId) {
    return db.events
      .where('personId').equals(personId)
      .reverse()
      .sortBy('date')
  },

  async getRecent(personId, limit = 5) {
    const events = await db.events
      .where('personId').equals(personId)
      .reverse()
      .sortBy('date')
    return events.slice(-limit)
  },

  async getTimeline(personId) {
    return db.events
      .where('personId').equals(personId)
      .sortBy('date')
  },

  async delete(id) {
    return db.events.delete(id)
  }
}
