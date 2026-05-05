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
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cn('transition-transform', readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110')}
        >
          <Star className={cn('w-4 h-4 transition-colors',
            (hover || value) >= n ? 'text-[--color-amber-400] fill-[--color-amber-400]' : 'text-white/20')} />
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
    const newFiles = [...photoFiles, ...files].slice(0, 4)
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
      cardId, reviewerId: user.id,
      cardRating: cardRating || undefined,
      organizerRating: organizerRating || undefined,
      comment, photos: uploadedPhotos,
    })
    if (ok) {
      toast(t('submitted'), 'success')
      const updated = await fetchReviews(cardId)
      setReviews(updated)
      setPhotoFiles([]); setPhotoPreviews([])
    }
    setSubmitting(false)
  }

  const avgCard = reviews.filter(r => r.card_rating).map(r => r.card_rating as number)
  const avgOrg = reviews.filter(r => r.organizer_rating).map(r => r.organizer_rating as number)
  const avgCardRating = avgCard.length ? (avgCard.reduce((a, b) => a + b, 0) / avgCard.length).toFixed(1) : null
  const avgOrgRating = avgOrg.length ? (avgOrg.reduce((a, b) => a + b, 0) / avgOrg.length).toFixed(1) : null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="space-y-5"
    >
      <header className="flex items-end justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <div className="eyebrow mb-1.5">— guestbook</div>
          <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold flex items-baseline gap-2">
            {t('title')}
            <span className="font-mono text-sm text-[--color-mist-300] tabular-nums">{reviews.length}</span>
          </h2>
        </div>
        <div className="flex gap-4 text-[12px] font-medium">
          {avgCardRating && (
            <span className="text-[--color-amber-400] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[--color-amber-400]" />
              <span className="font-semibold">{avgCardRating}</span>
              <span className="text-[--color-mist-400] text-[10px] uppercase">{t('cardRating')}</span>
            </span>
          )}
          {avgOrgRating && isOrganizer && (
            <span className="text-[--color-violet-400] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[--color-violet-400]" />
              <span className="font-semibold">{avgOrgRating}</span>
              <span className="text-[--color-mist-400] text-[10px] uppercase">{t('organizerRating')}</span>
            </span>
          )}
        </div>
      </header>

      {canReview && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-[--color-coral-300] text-base font-semibold">
            {myReview ? t('editReview') : t('writeReview')}
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="eyebrow">{t('cardRating')}</p>
              <StarRating value={cardRating} onChange={setCardRating} />
            </div>

            {isOrganizer && (
              <div className="space-y-1.5">
                <p className="eyebrow">{t('organizerRating')}</p>
                <StarRating value={organizerRating} onChange={setOrganizerRating} />
              </div>
            )}

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl
                         text-[--color-mist-50] text-[13px] placeholder:text-[--color-mist-500]
                         focus:outline-none focus:border-[--color-coral-500]/40 transition-all resize-none"
            />

            {photoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-xl" alt="" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-[--color-rose-500] rounded-full grid place-items-center hover:bg-[--color-rose-400] transition-colors">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {photoPreviews.length < 4 && (
                <button onClick={() => photoInputRef.current?.click()}
                  className="btn-ghost flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold">
                  <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('addPhotos')}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />

              <button onClick={handleSubmit}
                disabled={submitting || (!cardRating && !organizerRating && !comment.trim())}
                className="btn-primary flex items-center gap-2 ms-auto px-4 py-2 rounded-xl text-[12px] font-semibold
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin relative z-[1]" /> : <Send className="w-3.5 h-3.5 relative z-[1]" strokeWidth={2.5} />}
                <span className="relative z-[1]">{t('submit')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[--color-mist-500]" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-[12px] text-[--color-mist-500] text-center py-6">{t('noReviews')}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={cn(
              'p-4 rounded-2xl border space-y-3',
              r.reviewer_id === user?.id
                ? 'bg-gradient-to-br from-[--color-coral-500]/8 to-[--color-violet-500]/4 border-[--color-coral-500]/20'
                : 'bg-white/[0.02] border-white/[0.06]'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden grid place-items-center
                                  bg-gradient-to-br from-[--color-violet-500] to-[--color-cyan-400]
                                  text-white font-mono text-[11px] font-semibold">
                    {r.reviewer_avatar
                      ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                      : r.reviewer_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[13px] font-display font-semibold text-[--color-mist-50]">{r.reviewer_name}</span>
                </div>
                <span className="font-mono text-[10px] text-[--color-mist-400]">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-4 flex-wrap text-[10px] font-medium">
                {r.card_rating && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={r.card_rating} readOnly />
                    <span className="text-[--color-mist-400] uppercase">{t('cardRating')}</span>
                  </div>
                )}
                {r.organizer_rating && isOrganizer && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={r.organizer_rating} readOnly />
                    <span className="text-[--color-mist-400] uppercase">{t('organizerRating')}</span>
                  </div>
                )}
              </div>

              {r.comment && (
                <p className="text-[13px] text-[--color-mist-200] leading-relaxed border-s-2 border-[--color-coral-500]/40 ps-3 italic">
                  &ldquo;{r.comment}&rdquo;
                </p>
              )}

              {r.photos && r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {r.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} className="w-20 h-20 object-cover rounded-xl hover:opacity-80 transition-opacity" alt="" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.section>
  )
}
