import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import './MovieReviews.css'

type Review = {
  userId: string
  displayName: string
  rating: number
  comment: string
  updatedAt?: Timestamp | null
}

type MovieReviewsProps = {
  movieId: number
  user: User | null
}

export default function MovieReviews({ movieId, user }: MovieReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    const reviewsRef = collection(db, 'movies', String(movieId), 'reviews')
    const reviewsQuery = query(reviewsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const nextReviews = snapshot.docs.map((reviewDoc) => {
          const data = reviewDoc.data()
          return {
            userId: reviewDoc.id,
            displayName:
              typeof data.displayName === 'string' && data.displayName.trim()
                ? data.displayName
                : 'Người dùng CineScope',
            rating:
              typeof data.rating === 'number'
                ? Math.min(5, Math.max(1, data.rating))
                : 0,
            comment: typeof data.comment === 'string' ? data.comment : '',
            updatedAt: (data.updatedAt as Timestamp | null) ?? null,
          }
        })

        setReviews(nextReviews)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('Không tải được đánh giá:', snapshotError)
        setError('Không tải được đánh giá. Hãy kiểm tra cấu hình Firestore và Security Rules.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [movieId])

  const myReview = useMemo(
    () => reviews.find((review) => review.userId === user?.uid),
    [reviews, user?.uid],
  )

  useEffect(() => {
    setRating(myReview?.rating || 5)
    setComment(myReview?.comment || '')
  }, [myReview?.rating, myReview?.comment, movieId])

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
  }, [reviews])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!user) {
      setError('Anh cần đăng nhập để gửi đánh giá.')
      return
    }

    const cleanComment = comment.trim()
    if (!cleanComment) {
      setError('Anh hãy nhập bình luận trước khi gửi.')
      return
    }

    if (cleanComment.length > 1000) {
      setError('Bình luận tối đa 1.000 ký tự.')
      return
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'movies', String(movieId), 'reviews', user.uid),
        {
          userId: user.uid,
          displayName: (user.displayName || user.email?.split('@')[0] || 'Người dùng').slice(0, 60),
          rating,
          comment: cleanComment,
          updatedAt: serverTimestamp(),
        },
      )
      setNotice(myReview ? 'Đánh giá đã được cập nhật.' : 'Đã gửi đánh giá của anh.')
    } catch (submitError) {
      console.error('Không gửi được đánh giá:', submitError)
      setError('Không gửi được. Hãy kiểm tra Firestore Rules và thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !myReview) return
    if (!window.confirm('Anh muốn xóa đánh giá của mình chứ?')) return

    setError('')
    setNotice('')
    setSaving(true)
    try {
      await deleteDoc(doc(db, 'movies', String(movieId), 'reviews', user.uid))
      setComment('')
      setRating(5)
      setNotice('Đã xóa đánh giá của anh.')
    } catch (deleteError) {
      console.error('Không xóa được đánh giá:', deleteError)
      setError('Không xóa được đánh giá. Hãy kiểm tra Firestore Rules.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="movie-reviews" aria-labelledby="movie-reviews-title">
      <div className="reviews-heading">
        <div>
          <p className="reviews-eyebrow">CỘNG ĐỒNG CINESCOPE</p>
          <h2 id="movie-reviews-title">Đánh giá & bình luận</h2>
          <p className="reviews-subtitle">
            Chia sẻ cảm nhận của anh về bộ phim với mọi người.
          </p>
        </div>
        <div className="reviews-summary" aria-label="Điểm đánh giá cộng đồng">
          <strong>{reviews.length ? averageRating.toFixed(1) : '—'}</strong>
          <span className="reviews-summary-stars" aria-hidden="true">★★★★★</span>
          <small>{reviews.length} đánh giá</small>
        </div>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <label className="review-field-label">Điểm của anh</label>
        <div className="review-star-picker" role="radiogroup" aria-label="Chọn số sao">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= rating ? 'review-star selected' : 'review-star'}
              onClick={() => setRating(star)}
              aria-label={`${star} sao`}
              aria-pressed={rating === star}
              disabled={!user || saving}
            >
              ★
            </button>
          ))}
          <span>{rating}/5</span>
        </div>

        <label className="review-field-label" htmlFor="movie-review-comment">
          Bình luận
        </label>
        <textarea
          id="movie-review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={user ? 'Anh nghĩ gì về bộ phim này?' : 'Đăng nhập để viết bình luận...'}
          rows={4}
          maxLength={1000}
          disabled={!user || saving}
        />
        <div className="review-form-footer">
          <span>{comment.length}/1000 ký tự</span>
          <div className="review-form-actions">
            {myReview && (
              <button
                type="button"
                className="review-delete-button"
                onClick={() => void handleDelete()}
                disabled={saving}
              >
                Xóa đánh giá
              </button>
            )}
            <button className="review-submit-button" type="submit" disabled={!user || saving}>
              {saving ? 'Đang gửi…' : myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </button>
          </div>
        </div>
        {!user && <p className="review-hint">Anh hãy đăng nhập bằng tài khoản CineScope để đánh giá phim.</p>}
        {error && <p className="review-message error" role="alert">{error}</p>}
        {notice && <p className="review-message success" role="status">{notice}</p>}
      </form>

      <div className="review-list-heading">
        <h3>Bình luận của cộng đồng</h3>
        <span>{reviews.length}</span>
      </div>

      {loading ? (
        <p className="reviews-empty">Đang tải đánh giá…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</p>
      ) : (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.userId}>
              <div className="review-avatar" aria-hidden="true">
                {(review.displayName.trim()[0] || 'C').toLocaleUpperCase('vi')}
              </div>
              <div className="review-content">
                <div className="review-item-top">
                  <strong>{review.displayName}</strong>
                  <span className="review-item-stars" aria-label={`${review.rating} trên 5 sao`}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <p>{review.comment}</p>
                {review.updatedAt && (
                  <time dateTime={review.updatedAt.toDate().toISOString()}>
                    {review.updatedAt.toDate().toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
                {user?.uid === review.userId && <span className="review-own-label">Đánh giá của anh</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
