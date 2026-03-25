'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Star, Send, Loader2, ImagePlus, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { fetchReviews, submitReview, Review } from '@/lib/reviews'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function StarRating({ value, onChange, readOnly }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cn('transition-colors', readOnly ? 'cursor-default' : 'cursor-pointer')}
        >
          <Star className={cn('w-5 h-5 transition-colors', (hover || value) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
        </button>
      ))}
    </div>
  )
}

interface ReviewSectionProps {
  cardId: string
  cardOrganizerRole: string
  cardCreatedByUserId: string
  isParticipant: boolean
  isPast: boolean
}

export function ReviewSection({ cardId, cardOrganizerRole, cardCreatedByUserId, isParticipant, isPast }: ReviewSectionProps) {
  const t = useTranslations('reviews')
  const { user } = useAuth()
  const { toast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [cardRating, setCardRating] = useState(0)
  const [organizerRating, setOrganizerRating] = useState(0)
  const [comment, setComment] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const isOrganizer = ['guide', 'coach', 'instructor', 'driver', 'organizer'].includes(cardOrganizerRole)
  const isCardCreator = user?.id === cardCreatedByUserId
  const myReview = reviews.find(r => r.reviewer_id === user?.id)
  // Block organizer from reviewing their own card
  const canReview = isPast && isParticipant && user && !isCardCreator

  useEffect(() => {
    fetchReviews(cardId).then(r => { setReviews(r); setLoading(false) })
  }, [cardId])

  useEffect(() => {
    if (myReview) {
      setCardRating(myReview.card_rating || 0)
      setOrganizerRating(myReview.organizer_rating || 0)
      setComment(myReview.comment || '')
    }
  }, [myReview])

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = [...photoFiles, ...files].slice(0, 4) // max 4 photos
    setPhotoFiles(newFiles)
    setPhotoPreviews(newFiles.map(f => URL.createObjectURL(f)))
  }

  const removePhoto = (i: number) => {
    const newFiles = photoFiles.filter((_, idx) => idx !== i)
    setPhotoFiles(newFiles)
    setPhotoPreviews(newFiles.map(f => URL.createObjectURL(f)))
  }

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of photoFiles) {
      const ext = file.name.split('.').pop()
      const path = `reviews/${cardId}/${user!.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('card-images').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('card-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async () => {
    if (!user || (!cardRating && !organizerRating && !comment.trim())) return
    setSubmitting(true)
    const uploadedPhotos = photoFiles.length > 0 ? await uploadPhotos() : (myReview?.photos || [])
    const ok = await submitReview({
      cardId,
      reviewerId: user.id,
      cardRating: cardRating || undefined,
      organizerRating: organizerRating || undefined,
      comment,
      photos: uploadedPhotos,
    })
    if (ok) {
      toast(t('submitted'), 'success')
      const updated = await fetchReviews(cardId)
      setReviews(updated)
      setPhotoFiles([])
      setPhotoPreviews([])
    }
    setSubmitting(false)
  }

  const avgCard = reviews.filter(r => r.card_rating).map(r => r.card_rating as number)
  const avgOrg = reviews.filter(r => r.organizer_rating).map(r => r.organizer_rating as number)
  const avgCardRating = avgCard.length ? (avgCard.reduce((a, b) => a + b, 0) / avgCard.length).toFixed(1) : null
  const avgOrgRating = avgOrg.length ? (avgOrg.reduce((a, b) => a + b, 0) / avgOrg.length).toFixed(1) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="bg-gray-900 rounded-2xl p-5 space-y-5 border border-white/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          {t('title')} ({reviews.length})
        </h2>
        <div className="flex gap-4 text-sm">
          {avgCardRating && (
            <span className="text-amber-400">⭐ {avgCardRating} <span className="text-gray-500 text-xs">{t('cardRating')}</span></span>
          )}
          {avgOrgRating && isOrganizer && (
            <span className="text-purple-400">⭐ {avgOrgRating} <span className="text-gray-500 text-xs">{t('organizerRating')}</span></span>
          )}
        </div>
      </div>

      {/* Review form */}
      {canReview && (
        <div className="border border-teal-500/20 rounded-xl p-4 space-y-4 bg-teal-500/5">
          <h3 className="text-sm font-medium text-teal-400">{myReview ? t('editReview') : t('writeReview')}</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1.5">{t('cardRating')}</p>
              <StarRating value={cardRating} onChange={setCardRating} />
            </div>

            {isOrganizer && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">{t('organizerRating')}</p>
                <StarRating value={organizerRating} onChange={setOrganizerRating} />
              </div>
            )}

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm
                         placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 transition-all resize-none"
            />

            {/* Photo previews */}
            {photoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Photo upload button */}
              {photoPreviews.length < 4 && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-gray-400
                             hover:text-white hover:border-white/20 transition-all text-sm"
                >
                  <ImagePlus className="w-4 h-4" />
                  {t('addPhotos')}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />

              <button
                onClick={handleSubmit}
                disabled={submitting || (!cardRating && !organizerRating && !comment.trim())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-medium
                           hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all ms-auto"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-600" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">{t('noReviews')}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={cn(
              'p-4 rounded-xl border space-y-2',
              r.reviewer_id === user?.id ? 'bg-teal-500/5 border-teal-500/20' : 'bg-gray-800/50 border-white/5'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                    {r.reviewer_avatar
                      ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                      : r.reviewer_name[0]}
                  </div>
                  <span className="text-sm font-medium text-white">{r.reviewer_name}</span>
                </div>
                <span className="text-xs text-gray-600">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-4 flex-wrap">
                {r.card_rating && (
                  <div className="flex items-center gap-1">
                    <StarRating value={r.card_rating} readOnly />
                    <span className="text-xs text-gray-500 ms-1">{t('cardRating')}</span>
                  </div>
                )}
                {r.organizer_rating && isOrganizer && (
                  <div className="flex items-center gap-1">
                    <StarRating value={r.organizer_rating} readOnly />
                    <span className="text-xs text-purple-400 ms-1">{t('organizerRating')}</span>
                  </div>
                )}
              </div>

              {r.comment && <p className="text-sm text-gray-300">{r.comment}</p>}

              {r.photos && r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {r.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} className="w-20 h-20 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
