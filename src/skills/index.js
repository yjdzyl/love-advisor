import goutoujunshi from './goutoujunshi.json'
import fangongzi from './fangongzi.json'
import tongjincheng from './tongjincheng.json'
import nuwa from './nuwa.json'
import colleague from './colleague.json'

export const skills = [goutoujunshi, fangongzi, tongjincheng, nuwa, colleague]

export function getSkill(id) {
  return skills.find(s => s.id === id)
}
