import { supabase } from './supabase'

export interface EventPhoto {
  id: string
  card_id: string
  user_id: string
  url: string
  caption?: string
  created_at: string
  uploader_name: string
  uploader_avatar?: string
}

export async function fetchEventPhotos(cardId: string): Promise<EventPhoto[]> {
  const { data, error } = await supabase
    .from('event_photos')
    .select('id, card_id, user_id, url, caption, created_at, profiles(full_name, avatar_url)')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const profile = row.profiles as { full_name: string; avatar_url?: string } | null
    return {
      id: row.id as string,
      card_id: row.card_id as string,
      user_id: row.user_id as string,
      url: row.url as string,
      caption: row.caption as string | undefined,
      created_at: row.created_at as string,
      uploader_name: profile?.full_name || 'Unknown',
      uploader_avatar: profile?.avatar_url,
    }
  })
}

export async function uploadEventPhoto(
  cardId: string,
  userId: string,
  file: File,
  caption?: string
): Promise<EventPhoto | null> {
  const ext = file.name.split('.').pop()
  const path = `event-photos/${cardId}/${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('card-images')
    .upload(path, file, { upsert: false })

  if (uploadErr) return null

  const { data: urlData } = supabase.storage.from('card-images').getPublicUrl(path)

  const { data: row, error: insertErr } = await supabase
    .from('event_photos')
    .insert({ card_id: cardId, user_id: userId, url: urlData.publicUrl, caption: caption || null })
    .select('id, card_id, user_id, url, caption, created_at, profiles(full_name, avatar_url)')
    .single()

  if (insertErr || !row) return null

  const profile = (row as Record<string, unknown>).profiles as { full_name: string; avatar_url?: string } | null
  return {
    id: row.id,
    card_id: row.card_id,
    user_id: row.user_id,
    url: row.url,
    caption: row.caption,
    created_at: row.created_at,
    uploader_name: profile?.full_name || 'Unknown',
    uploader_avatar: profile?.avatar_url,
  }
}

export async function deleteEventPhoto(id: string): Promise<boolean> {
  const { error } = await supabase.from('event_photos').delete().eq('id', id)
  return !error
}
