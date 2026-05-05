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
          className={cn('transition-colors', readOnly ? 'cursor-default' : 'cursor-pointer')}
        >
          <Star className={cn('w-4 h-4 transition-colors',
            (hover || value) >= n ? 'text-[--color-amber-400] fill-[--color-amber-400]' : 'text-[--color-ink-700]')} />
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
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <header className="flex items-end justify-between pb-3 border-b border-[--color-ink-800]">
        <div>
          <div className="eyebrow mb-1">— guestbook</div>
          <h2 className="font-display text-[--color-bone-50] text-2xl flex items-baseline gap-2">
            {t('title')}
            <span className="font-mono text-sm text-[--color-bone-400] tabular-nums">
              {String(reviews.length).padStart(2, '0')}
            </span>
          </h2>
        </div>
        <div className="flex gap-4 font-mono text-[11px] tracking-[0.08em]">
          {avgCardRating && (
            <span className="text-[--color-amber-400] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[--color-amber-400]" />
              {avgCardRating} <span className="text-[--color-bone-600] uppercase">{t('cardRating')}</span>
            </span>
          )}
          {avgOrgRating && isOrganizer && (
            <span className="text-[--color-amber-400] flex items-center gap-1">
              <Star className="w-3 h-3 fill-[--color-amber-400]" />
              {avgOrgRating} <span className="text-[--color-bone-600] uppercase">{t('organizerRating')}</span>
            </span>
          )}
        </div>
      </header>

      {/* Review form */}
      {canReview && (
        <div className="border border-[--color-amber-400]/20 rounded-sm p-5 space-y-4 bg-[--color-amber-400]/5">
          <h3 className="font-mono text-[11px] tracking-[0.18em] uppercase text-[--color-amber-400]">
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
              className="w-full px-3.5 py-2.5 bg-[--color-ink-850] border border-[rgba(255,255,255,.06)] rounded-sm
                         text-[--color-bone-50] text-[13px] placeholder:text-[--color-bone-600]
                         focus:outline-none focus:border-[--color-amber-400]/40 transition-all resize-none"
            />

            {photoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} className="w-full h-full object-cover rounded-sm" alt="" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-[--color-coral-500] rounded-full grid place-items-center hover:bg-[--color-coral-400] transition-colors">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {photoPreviews.length < 4 && (
                <button onClick={() => photoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-[rgba(255,255,255,.08)]
                             font-mono text-[10px] tracking-[0.16em] uppercase
                             text-[--color-bone-400] hover:text-[--color-amber-400] hover:border-[--color-amber-400]/30
                             transition-all">
                  <ImagePlus className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('addPhotos')}
                </button>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPhotos} />

              <button onClick={handleSubmit}
                disabled={submitting || (!cardRating && !organizerRating && !comment.trim())}
                className="flex items-center gap-2 ms-auto px-4 py-2 rounded-sm
                           font-mono text-[11px] tracking-[0.18em] uppercase font-semibold
                           bg-[--color-amber-400] text-[--color-amber-ink] hover:bg-[--color-amber-500]
                           transition-all shadow-[0_4px_20px_rgba(251,191,36,.18)]
                           disabled:opacity-40 disabled:cursor-not-allowed">
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" strokeWidth={2.5} />}
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[--color-bone-600]" /></div>
      ) : reviews.length === 0 ? (
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[--color-bone-600] text-center py-6">{t('noReviews')}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={cn(
              'p-4 rounded-sm border space-y-3',
              r.reviewer_id === user?.id
                ? 'bg-[--color-amber-400]/5 border-[--color-amber-400]/20'
                : 'bg-[--color-ink-900] border-[rgba(255,255,255,.05)]'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full overflow-hidden grid place-items-center
                                  bg-[--color-ink-800] text-[--color-bone-200] font-mono text-[11px]
                                  border border-[--color-ink-700]">
                    {r.reviewer_avatar
                      ? <img src={r.reviewer_avatar} alt={r.reviewer_name} className="w-full h-full object-cover" />
                      : r.reviewer_name[0]?.toUpperCase()}
                  </div>
                  <span className="text-[13px] font-display text-[--color-bone-50]">{r.reviewer_name}</span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-[--color-bone-600]">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-4 flex-wrap font-mono text-[10px] tracking-[0.14em] uppercase">
                {r.card_rating && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={r.card_rating} readOnly />
                    <span className="text-[--color-bone-400]">{t('cardRating')}</span>
                  </div>
                )}
                {r.organizer_rating && isOrganizer && (
                  <div className="flex items-center gap-1.5">
                    <StarRating value={r.organizer_rating} readOnly />
                    <span className="text-[--color-bone-400]">{t('organizerRating')}</span>
                  </div>
                )}
              </div>

              {r.comment && (
                <p className="text-[13px] text-[--color-bone-200] leading-relaxed border-s-2 border-[--color-amber-400]/30 ps-3 italic">
                  &ldquo;{r.comment}&rdquo;
                </p>
              )}

              {r.photos && r.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {r.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} className="w-20 h-20 object-cover rounded-sm hover:opacity-80 transition-opacity" alt="" />
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
