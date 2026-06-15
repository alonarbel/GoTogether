// Auto-image for cards created without an uploaded photo.
// Builds a text prompt from the card's own fields and generates a matching image
// via Pollinations (free, no API key). The result truly relates to the event —
// "padel tournament in Tel Aviv" yields a padel image, not random stock.

// English anchor per card type so non-English titles still steer the image.
const TYPE_HINT: Record<string, string> = {
  trip: 'travel adventure outdoors',
  attraction: 'tourist attraction sightseeing',
  workshop: 'hands-on workshop class',
  sport: 'sports activity action',
  food: 'food culinary tasting',
  other: 'social group event',
}

export function autoImageForCard(input: {
  type?: string
  title?: string
  tags?: string[]
  city?: string
  country?: string
}): string {
  const parts = [
    input.title?.trim(),
    TYPE_HINT[input.type || 'other'] || TYPE_HINT.other,
    ...(input.tags || []),
    [input.city, input.country].filter(Boolean).join(' '),
    'realistic photo, high quality',
  ].filter(Boolean)

  const prompt = parts.join(', ')
  // Deterministic seed from the prompt so the same card keeps the same image.
  let seed = 0
  for (let i = 0; i < prompt.length; i++) seed = (seed * 31 + prompt.charCodeAt(i)) >>> 0

  const encoded = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encoded}?width=1200&height=800&seed=${seed}&nologo=true`
}
