/**
 * 17 条路由规则
 *
 * 每条规则：{ keywords: string[], skillId: string, score: number }
 * 用户输入命中关键词时，对应 Skill 获得相应分数
 */

export const RULES = [
  // 狗头军师 - 策略分析
  { keywords: ['策略', '博弈', '套路', '算计', '分析', '怎么办', '值不值得', '怎么看'], skillId: 'goutoujunshi', score: 3 },
  { keywords: ['怎么回', '回复', '话术', '怎么说', '如何回复'], skillId: 'goutoujunshi', score: 2 },

  // 梵公子 - 情绪/实战
  { keywords: ['生气', '愤怒', '暴躁', '发火', '吵架', '烦'], skillId: 'fangongzi', score: 3 },
  { keywords: ['情绪', '心情', '烦躁', '焦虑', '难过', '伤心'], skillId: 'fangongzi', score: 2 },
  { keywords: ['沟通', '表达', '说话', '聊天', '交流', '搭讪'], skillId: 'fangongzi', score: 2 },

  // 同事 - 职场
  { keywords: ['同事', '领导', '职场', '工作', '老板', '上司'], skillId: 'colleague', score: 3 },
  { keywords: ['开会', '汇报', '邮件', '方案', '项目', '晋升'], skillId: 'colleague', score: 2 },

  // 女娲 - 关系分析
  { keywords: ['暧昧', '喜欢', '暗恋', '表白', '心动', '好感'], skillId: 'nuwa', score: 3 },
  { keywords: ['约会', '牵手', '接吻', '亲密', '进展', '推进'], skillId: 'nuwa', score: 2 },
  { keywords: ['分手', '复合', '挽回', '冷战', '断联', '前任'], skillId: 'nuwa', score: 2 },
  { keywords: ['婚姻', '结婚', '离婚', '家庭', '父母', '结婚'], skillId: 'nuwa', score: 2 },
  { keywords: ['回忆', '总结', '回顾', '梳理', '复盘', '时间线'], skillId: 'nuwa', score: 1 },

  // 童锦程 - 决策/人性
  { keywords: ['决策', '选择', '纠结', '犹豫', '迷茫', '该不该'], skillId: 'tongjincheng', score: 3 },
  { keywords: ['利弊', '风险', '后果', '影响', '权衡', '比较'], skillId: 'tongjincheng', score: 2 },
  { keywords: ['建议', '推荐', '方案', '计划', '行动', '怎么办'], skillId: 'tongjincheng', score: 1 },

  // 安慰/鼓励 - 梵公子
  { keywords: ['安慰', '鼓励', '支持', '陪伴', '难受'], skillId: 'fangongzi', score: 1 },
]
