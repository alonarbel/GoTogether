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
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      className="bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/5"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-400" />
          {t('eventPhotos')} {photos.length > 0 && <span className="text-sm text-gray-500 font-normal">({photos.length})</span>}
        </h2>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-all text-xs font-medium disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {t('uploadPhoto')}
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {canUpload ? t('noPhotosYetParticipant') : t('noPhotosYet')}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => openLightbox(i)}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 group"
            >
              <img src={p.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
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
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
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
    </motion.div>
  )
}
