import db from '../db.js'

export const relationshipStore = {
  async create(data) {
    return db.relationships.add({
      ...data,
      updatedAt: new Date().toISOString().slice(0, 10)
    })
  },

  async get(id) {
    return db.relationships.get(id)
  },

  async getByPerson(personId) {
    return db.relationships
      .where('personId').equals(personId)
      .reverse()
      .first()
  },

  async upsert(personId, data) {
    const existing = await this.getByPerson(personId)
    if (existing) {
      await db.relationships.update(existing.id, {
        ...data,
        updatedAt: new Date().toISOString().slice(0, 10)
      })
      return existing.id
    } else {
      return db.relationships.add({
        ...data,
        personId,
        updatedAt: new Date().toISOString().slice(0, 10)
      })
    }
  },

  async delete(id) {
    return db.relationships.delete(id)
  }
}
