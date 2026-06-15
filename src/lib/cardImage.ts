// Auto-image for cards created without an uploaded photo.
// Picks a known-good Unsplash image that relates to the card's type / keywords.
// Zero-config: no API key, every URL is a stable Unsplash photo id already used
// elsewhere in the app, so it always loads.

const W = 'w=1200&q=80'
const u = (id: string) => `https://images.unsplash.com/photo-${id}?${W}`

// Pools per card type — first is the safe default, others add variety.
const BY_TYPE: Record<string, string[]> = {
  trip: ['1469854523086-cc02fe5d8800', '1476514525535-07fb3b4ae5f1', '1530789253388-582c481c54b0', '1501785888041-af3ef285b470'],
  attraction: ['1502602898657-3e91760cbb34', '1517760444937-f6397edcbbcd', '1499002238440-d264edd596ec'],
  workshop: ['1504280390367-361c6d9f38f4', '1503602642458-232111445657', '1513475382585-d06e58bcb0e0'],
  sport: ['1507525428034-b723cf961d3e', '1502933691298-84fc14542831', '1517649763962-0c623066013b'],
  food: ['1488459716781-31db52582fe9', '1414235077428-338989a2e8c0', '1504674900247-0877df9cc836'],
  other: ['1488646953014-85cb44e25828', '1500530855697-b586d89ba3ee', '1469474968028-56623f02e42e'],
}

// Keyword overrides — if a tag/title hits one of these, prefer its image.
const BY_KEYWORD: { match: RegExp; id: string }[] = [
  { match: /beach|ים|חוף|surf|גליש|swim|שחי/i, id: '1507525428034-b723cf961d3e' },
  { match: /desert|מדבר|נגב|מצדה|כוכב|star/i, id: '1469854523086-cc02fe5d8800' },
  { match: /food|אוכל|שוק|market|בישול|cook|קולינר/i, id: '1488459716781-31db52582fe9' },
  { match: /bike|אופני|cycl|רכיב/i, id: '1501785888041-af3ef285b470' },
  { match: /yoga|יוגה|medit|מדיט/i, id: '1506126613408-eca07ce68773' },
  { match: /city|עיר|tour|סיור|jerusalem|ירושלים|tel.?aviv|תל.?אביב/i, id: '1502602898657-3e91760cbb34' },
  { match: /water|מפל|נחל|river|waterfall|אגם|lake|כנרת/i, id: '1476514525535-07fb3b4ae5f1' },
]

// Stable index from a string so the same card always gets the same photo.
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function autoImageForCard(input: {
  type?: string
  title?: string
  tags?: string[]
}): string {
  const haystack = [input.title, ...(input.tags || [])].filter(Boolean).join(' ')
  for (const { match, id } of BY_KEYWORD) {
    if (match.test(haystack)) return u(id)
  }
  const pool = BY_TYPE[input.type || 'other'] || BY_TYPE.other
  return u(pool[hash(haystack || input.type || 'other') % pool.length])
}
