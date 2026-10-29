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
  onClose: () => void
}

type SourceType = 'vidsrc' | 'embed2'

const MoviePlayer = forwardRef<HTMLDivElement, MoviePlayerProps>(({ movie, onClose }, ref) => {
  const [sourceType, setSourceType] = useState<SourceType>('vidsrc')

  const getEmbedUrl = (id: number, type: SourceType) => {
    switch (type) {
      case 'vidsrc':
        return `https://vidsrc.to/embed/movie/${id}`
      case 'embed2':
        return `https://www.2embed.cc/embed/${id}`
      default:
        return `https://vidsrc.to/embed/movie/${id}`
    }
  }

  return (
    <div ref={ref} className="movie-player-container-large">


      <div className="large-video-frame">
        <iframe
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
        <span className="toolbar-label">Chọn nguồn phát dự phòng:</span>
        <div className="toolbar-pills">
          <button
            className={`source-pill-item ${sourceType === 'vidsrc' ? 'active' : ''}`}
            onClick={() => setSourceType('vidsrc')}
          >
            Nguồn 1 (VidSrc Ổn định)
          </button>
          <button
            className={`source-pill-item ${sourceType === 'embed2' ? 'active' : ''}`}
            onClick={() => setSourceType('embed2')}
          >
            Nguồn 2 (2Embed Backup)
          </button>
        </div>
      </div>
    </div>
  )
})

export default MoviePlayer