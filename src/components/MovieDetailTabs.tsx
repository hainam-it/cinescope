import { useState } from 'react'
import type { User } from 'firebase/auth'
import type { Movie } from '../types/movie'
import MovieReviews from './MovieReviews'
import './MovieDetailTabs.css'

type MovieDetailTabsProps = {
  movie: Movie
  user: User | null
}

type DetailTab = 'info' | 'cast' | 'trailer'

export default function MovieDetailTabs({ movie, user }: MovieDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('info')
  const trailerSearch = new URL('https://www.youtube.com/results')
  trailerSearch.searchParams.set('search_query', `${movie.title} ${movie.year} official trailer`)

  return (
    <section className="movie-detail-extras">
      <div className="movie-detail-tabs" role="tablist" aria-label="Thông tin phim">
        <button type="button" role="tab" aria-selected={activeTab === 'info'} className={activeTab === 'info' ? 'detail-tab active' : 'detail-tab'} onClick={() => setActiveTab('info')}>Thông tin</button>
        <button type="button" role="tab" aria-selected={activeTab === 'cast'} className={activeTab === 'cast' ? 'detail-tab active' : 'detail-tab'} onClick={() => setActiveTab('cast')}>Diễn viên</button>
        <button type="button" role="tab" aria-selected={activeTab === 'trailer'} className={activeTab === 'trailer' ? 'detail-tab active' : 'detail-tab'} onClick={() => setActiveTab('trailer')}>Trailer</button>
      </div>

      <div className="movie-detail-tab-panel" role="tabpanel">
        {activeTab === 'info' && (
          <div className="detail-info-grid">
            <div>
              <span className="detail-info-label">Nội dung phim</span>
              <p>{movie.overview || 'Chưa có mô tả cho bộ phim này.'}</p>
            </div>
            <dl className="detail-facts">
              <div><dt>Năm phát hành</dt><dd>{movie.year}</dd></div>
              <div><dt>Thời lượng</dt><dd>{movie.runtime > 0 ? `${movie.runtime} phút` : 'Chưa cập nhật'}</dd></div>
              <div><dt>Thể loại</dt><dd>{movie.genres.join(' · ') || 'Chưa phân loại'}</dd></div>
              <div><dt>Đạo diễn</dt><dd>{movie.directors.length ? movie.directors.join(', ') : 'Chưa cập nhật'}</dd></div>
            </dl>
          </div>
        )}

        {activeTab === 'cast' && (
          <div className="detail-cast-panel">
            {movie.cast.length ? (
              movie.cast.map((person, index) => <span className="detail-cast-chip" key={`${person}-${index}`}>{person}</span>)
            ) : (
              <p className="detail-panel-empty">Chưa có thông tin diễn viên cho phim này.</p>
            )}
          </div>
        )}

        {activeTab === 'trailer' && (
          <div className="detail-trailer-panel">
            <div>
              <h3>Tìm trailer của {movie.title}</h3>
              <p>Trailer có thể khác nhau theo quốc gia và đơn vị phát hành. CineScope mở kết quả YouTube để anh chọn trailer chính thức, thay vì tự nhúng nguồn không xác minh.</p>
            </div>
            <a href={trailerSearch.toString()} target="_blank" rel="noopener noreferrer">Tìm trailer chính thức ↗</a>
          </div>
        )}
      </div>

      <MovieReviews movieId={movie.id} user={user} />
    </section>
  )
}
