export interface LevelConfig {
  level: number; nameEn: string; nameHe: string; xpRequired: number; color: string; emoji: string
}

export const LEVELS: LevelConfig[] = [
  { level:1, nameEn:'Beginner',  nameHe:'מתחיל',  xpRequired:0,    color:'#8A8A9A', emoji:'🌱' },
  { level:2, nameEn:'Explorer',  nameHe:'חוקר',   xpRequired:100,  color:'#6B8FD4', emoji:'🔭' },
  { level:3, nameEn:'Builder',   nameHe:'בונה',   xpRequired:300,  color:'#5BA89C', emoji:'🔨' },
  { level:4, nameEn:'Speaker',   nameHe:'דובר',   xpRequired:650,  color:'#7BAE5E', emoji:'🗣️' },
  { level:5, nameEn:'Traveler',  nameHe:'נוסע',   xpRequired:1250, color:'#C49A3C', emoji:'✈️' },
  { level:6, nameEn:'Confident', nameHe:'בטוח',   xpRequired:2250, color:'#C47A3C', emoji:'💪' },
  { level:7, nameEn:'Advanced',  nameHe:'מתקדם',  xpRequired:3850, color:'#B45EA4', emoji:'⚡' },
  { level:8, nameEn:'Master',    nameHe:'אלוף',   xpRequired:6350, color:'#E8A87C', emoji:'🏆' },
]

export function getLevelForXP(xp: number): LevelConfig {
  let c = LEVELS[0]
  for (const l of LEVELS) { if (xp >= l.xpRequired) c = l; else break }
  return c
}
export function getNextLevel(currentLevel: number): LevelConfig | null {
  return LEVELS.find(l => l.level === currentLevel + 1) ?? null
}
export function getXPIntoLevel(xp: number): number {
  return xp - getLevelForXP(xp).xpRequired
}
export function getXPForNextLevel(currentLevel: number): number {
  const next = getNextLevel(currentLevel)
  if (!next) return Infinity
  const cur = LEVELS.find(l => l.level === currentLevel)!
  return next.xpRequired - cur.xpRequired
}
export function getLevelProgress(xp: number): number {
  const cur = getLevelForXP(xp)
  const band = getXPForNextLevel(cur.level)
  if (!isFinite(band)) return 1
  return Math.min(getXPIntoLevel(xp) / band, 1)
}
