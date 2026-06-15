// Auto-image for cards created without an uploaded photo.
// Uses LoremFlickr (free, no API key) which returns a real photo matching
// keyword tags. Titles are often Hebrew, so we map activity/place words to
// English Flickr tags; otherwise we fall back to a per-type keyword.

// Activity / place keywords → English Flickr tags. First match wins.
const KEYWORDS: { match: RegExp; tag: string }[] = [
  { match: /padel|פאדל|פדל/i, tag: 'padel' },
  { match: /tennis|טניס/i, tag: 'tennis' },
  { match: /basketbal|כדורסל/i, tag: 'basketball' },
  { match: /footbal|soccer|כדורגל/i, tag: 'soccer' },
  { match: /surf|גליש/i, tag: 'surfing' },
  { match: /div(e|ing)|צלילה|snorkel|שנורקל/i, tag: 'scuba,diving' },
  { match: /yoga|יוגה/i, tag: 'yoga' },
  { match: /run|מרתון|ריצה/i, tag: 'running' },
  { match: /bike|cycl|אופני|רכיב/i, tag: 'cycling' },
  { match: /hik|trek|טרק|מסלול|טיול/i, tag: 'hiking' },
  { match: /waterfall|מפל|נחל|river/i, tag: 'waterfall' },
  { match: /desert|מדבר|נגב|מצדה|מכתש|crater/i, tag: 'desert' },
  { match: /star|כוכב|astro|אסטרו|night sky/i, tag: 'stargazing,night' },
  { match: /cook|בישול|בשל/i, tag: 'cooking' },
  { match: /food|אוכל|שוק|market|קולינר|טעימ/i, tag: 'streetfood,market' },
  { match: /ceramic|pottery|קרמיק|חרס/i, tag: 'pottery' },
  { match: /wine|יין/i, tag: 'wine' },
  { match: /jerusalem|ירושלים/i, tag: 'jerusalem' },
  { match: /haifa|חיפה/i, tag: 'haifa' },
  { match: /beach|חוף|\bים\b|sea/i, tag: 'beach' },
]

// Per-type fallback when no keyword matched.
const TYPE_TAG: Record<string, string> = {
  trip: 'travel,landscape',
  attraction: 'landmark,sightseeing',
  workshop: 'workshop,craft',
  sport: 'sport',
  food: 'food',
  other: 'event',
}

function tagsFor(input: { type?: string; title?: string; tags?: string[] }): string {
  const hay = [input.title, ...(input.tags || [])].filter(Boolean).join(' ')
  for (const { match, tag } of KEYWORDS) {
    if (match.test(hay)) return tag
  }
  return TYPE_TAG[input.type || 'other'] || TYPE_TAG.other
}

export function autoImageForCard(input: {
  type?: string
  title?: string
  tags?: string[]
  city?: string
  country?: string
}): string {
  const tags = tagsFor(input)
  // Deterministic lock so a given card keeps the same photo.
  const key = `${tags}|${input.title || ''}`
  let lock = 0
  for (let i = 0; i < key.length; i++) lock = (lock * 31 + key.charCodeAt(i)) >>> 0
  return `https://loremflickr.com/1200/800/${tags}?lock=${lock % 100000}`
}
