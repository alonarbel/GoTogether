import { supabase } from './supabase'

export type NotificationType = 'participant_joined' | 'min_reached' | 'deadline_soon'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  card_id?: string
  card_title?: string
  actor_id?: string
  actor_name?: string
  actor_avatar?: string
  read: boolean
  created_at: string
}

export async function fetchNotifications(userId: string, limit = 20): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id, user_id, type, card_id, actor_id, read, created_at,
      travel_cards(title),
      profiles!notifications_actor_id_fkey(full_name, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((row: Record<string, unknown>) => {
    const card = row.travel_cards as { title: string } | null
    const actor = row.profiles as { full_name: string; avatar_url?: string } | null
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      type: row.type as NotificationType,
      card_id: row.card_id as string | undefined,
      card_title: card?.title,
      actor_id: row.actor_id as string | undefined,
      actor_name: actor?.full_name,
      actor_avatar: actor?.avatar_url,
      read: row.read as boolean,
      created_at: row.created_at as string,
    }
  })
}

export async function unreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) return 0
  return count || 0
}

export async function markAsRead(id: string): Promise<boolean> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  return !error
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  return !error
}
