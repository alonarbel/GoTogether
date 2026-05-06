'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/components/ui/Toast'
import { fetchEventPhotos, uploadEventPhoto, deleteEventPhoto, EventPhoto } from '@/lib/eventPhotos'

interface EventPhotoGalleryProps {
  cardId: string
  isParticipant: boolean
}

export function EventPhotoGallery({ cardId, isParticipant }: EventPhotoGalleryProps) {
  const t = useTranslations('card')
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchEventPhotos(cardId).then(p => { setPhotos(p); setLoading(false) })
  }, [cardId])

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return
    setUploading(true)
    const uploaded: EventPhoto[] = []
    for (const file of Array.from(files)) {
      const photo = await uploadEventPhoto(cardId, user.id, file)
      if (photo) uploaded.push(photo)
    }
    if (uploaded.length > 0) {
      setPhotos(prev => [...uploaded, ...prev])
      toast(t('photoUploaded'), 'success')
    } else {
      toast(t('photoUploadFailed'), 'error')
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    const ok = await deleteEventPhoto(id)
    if (ok) {
      setPhotos(prev => prev.filter(p => p.id !== id))
      toast(t('photoDeleted'), 'info')
      setLightboxIndex(null)
    }
  }

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)
  const prevLightbox = () => setLightboxIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length))
  const nextLightbox = () => setLightboxIndex(i => (i === null ? null : (i + 1) % photos.length))

  const canUpload = isParticipant && !!user

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="space-y-5"
    >
      <header className="flex items-end justify-between pb-4 border-b border-[--color-mist-500]">
        <div>
          <div className="eyebrow mb-1.5">— from the field</div>
          <h2 className="font-display text-[--color-mist-50] text-2xl font-semibold flex items-baseline gap-2">
            <Camera className="w-4 h-4 text-[--color-coral-400] inline-block" strokeWidth={2} />
            {t('eventPhotos')}
            {photos.length > 0 && (
              <span className="font-mono text-sm text-[--color-mist-300] tabular-nums">
                {photos.length}
              </span>
            )}
          </h2>
        </div>
        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin relative z-[1]" /> : <Upload className="w-3 h-3 relative z-[1]" strokeWidth={2.5} />}
              <span className="relative z-[1]">{t('uploadPhoto')}</span>
            </button>
          </>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[--color-coral-400]" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-12 text-[12px] text-[--color-mist-500]">
          {canUpload ? t('noPhotosYetParticipant') : t('noPhotosYet')}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => openLightbox(i)}
              className="relative aspect-square rounded-xl overflow-hidden bg-[--color-night-800] group
                         hover:ring-2 hover:ring-[--color-coral-500]/40 transition-all"
            >
              <img src={p.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[300] backdrop-blur-xl flex items-center justify-center p-4"
            style={{ background: 'rgba(15,12,8,0.92)' }}
          >
            <button
              onClick={e => { e.stopPropagation(); closeLightbox() }}
              className="absolute top-4 end-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); prevLightbox() }}
                  className="absolute start-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); nextLightbox() }}
                  className="absolute end-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            <motion.div
              key={photos[lightboxIndex].id}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] flex flex-col items-center"
            >
              <img
                src={photos[lightboxIndex].url}
                alt=""
                className="max-w-full max-h-[75vh] rounded-lg object-contain"
              />
              <div className="mt-4 flex items-center justify-between gap-4 w-full text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                    {photos[lightboxIndex].uploader_avatar
                      ? <img src={photos[lightboxIndex].uploader_avatar} alt="" className="w-full h-full object-cover" />
                      : photos[lightboxIndex].uploader_name[0]}
                  </div>
                  <span>{photos[lightboxIndex].uploader_name}</span>
                </div>
                {photos[lightboxIndex].user_id === user?.id && (
                  <button
                    onClick={() => handleDelete(photos[lightboxIndex].id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('deletePhoto')}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
