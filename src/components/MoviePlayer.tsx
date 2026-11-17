
import { useState, forwardRef } from 'react'
import './MoviePlayer.css'

type Movie = {
  id: number
  title: string
  year: string
  genres: string[]
  overview: string
  rating: number
}

type MoviePlayerProps = {
  movie: Movie
}

type SourceType = 'videm' | 'vidsrc'

const MoviePlayer = forwardRef<HTMLDivElement, MoviePlayerProps>(
  ({ movie }, ref) => {
    // Mặc định sử dụng server Videm
    const [sourceType, setSourceType] = useState<SourceType>('videm')

    const getEmbedUrl = (id: number, type: SourceType) => {
      switch (type) {
        case 'videm':
          return `https://videm.buzz/embed/movie/${id}`

        case 'vidsrc':
          return `https://vidsrc.to/embed/movie/${id}`

        default:
          return `https://videm.buzz/embed/movie/${id}`
      }
    }

    return (
      <div
        ref={ref}
        className="movie-player-container-large"
      >
        <div className="large-video-frame">
          <iframe
            key={`${sourceType}-${movie.id}`}
            src={getEmbedUrl(movie.id, sourceType)}
            title={movie.title}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="player-sources-toolbar">
          <span className="toolbar-label">
            Chọn nguồn phát dự phòng:
          </span>

          <div className="toolbar-pills">
            <button
              type="button"
              className={`source-pill-item ${
                sourceType === 'videm' ? 'active' : ''
              }`}
              onClick={() => setSourceType('videm')}
            >
              Nguồn 1 (Videm)
            </button>

            <button
              type="button"
              className={`source-pill-item ${
                sourceType === 'vidsrc' ? 'active' : ''
              }`}
              onClick={() => setSourceType('vidsrc')}
            >
              Nguồn 2 (VidSrc)
            </button>
          </div>
        </div>
      </div>
    )
  }
)

MoviePlayer.displayName = 'MoviePlayer'

export default MoviePlayer
