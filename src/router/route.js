/**
 * 路由引擎 - 规则评分系统
 *
 * 根据用户输入关键词，计算各 Skill 的匹配分数，
 * 按分数降序排列返回推荐结果。
 */

import { RULES } from './rules.js'

/**
 * 对用户消息进行路由评分
 * @param {string} message - 用户输入
 * @returns {Array<{skillId: string, score: number}>} 按分数降序排列
 */
export function routeMessage(message) {
  const text = message.toLowerCase()
  const scores = {}

  for (const rule of RULES) {
    for (const keyword of rule.keywords) {
      if (text.includes(keyword)) {
        scores[rule.skillId] = (scores[rule.skillId] || 0) + rule.score
      }
    }
  }

  // 无匹配时兜底
  if (Object.keys(scores).length === 0) {
    return [{ skillId: 'goutoujunshi', score: 1 }]
  }

  return Object.entries(scores)
    .map(([skillId, score]) => ({ skillId, score }))
    .sort((a, b) => b.score - a.score)
}

/**
 * 根据模式获取推荐 Skill 列表
 * @param {string} message - 用户输入
 * @param {'quick'|'committee'|'decision'} mode - 响应模式
 * @returns {Array<{skillId: string, score: number}>}
 */
export function getRecommendedSkills(message, mode = 'quick') {
  const ranked = routeMessage(message)
  switch (mode) {
    case 'quick':
      return ranked.slice(0, 1)
    case 'committee':
      return ranked.slice(0, 3)
    case 'decision':
      return ranked
    default:
      return ranked.slice(0, 1)
  }
}
