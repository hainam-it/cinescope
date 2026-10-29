
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth'

import { auth } from './firebase'
import movieData from './data/movies.json'
import MoviePlayer from './components/MoviePlayer'
import MovieDetailTabs from './components/MovieDetailTabs'
import CineScopeBot from './components/CineScopeBot'
import './App.css'

type MovieRecord = {
  id: number
  title: string
  releaseDate?: string
  genres?: string[]
  rating?: number
  popularity?: number
  overview?: string
  posterPath?: string | null
  backdropPath?: string | null
  directors?: string[]
  cast?: string[]
  runtime?: number
}

type Movie = {
  id: number
  title: string
  year: string
  genres: string[]
  poster: string
  backdrop: string
  overview: string
  rating: number
  popularity: number
  runtime: number
  directors: string[]
  cast: string[]
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p/'
const FALLBACK = '/images/slider-badag.jpg'

const movies: Movie[] = (movieData as MovieRecord[])
  .map((item) => ({
    id: item.id,
    title: item.title || 'Chưa có tên',
    year: item.releaseDate?.slice(0, 4) || 'N/A',
    genres: item.genres?.length ? item.genres : ['Chưa phân loại'],
    poster: item.posterPath
      ? `${IMAGE_BASE}w500${item.posterPath}`
      : item.backdropPath
        ? `${IMAGE_BASE}w780${item.backdropPath}`
        : FALLBACK,
    backdrop: item.backdropPath
      ? `${IMAGE_BASE}original${item.backdropPath}`
      : item.posterPath
        ? `${IMAGE_BASE}w780${item.posterPath}`
        : FALLBACK,
    overview: item.overview || 'Chưa có mô tả cho bộ phim này.',
    rating: item.rating ?? 0,
    popularity: item.popularity ?? 0,
    runtime: item.runtime ?? 0,
    directors: item.directors ?? [],
    cast: item.cast ?? [],
  }))
  .sort((a, b) => b.popularity - a.popularity)

const featured = movies.slice(0, 6)

type AssistantHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [pendingScrollMovieId, setPendingScrollMovieId] = useState<number | null>(null)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [activeHero, setActiveHero] = useState(0)
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [isWatching, setIsWatching] = useState(false)

  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (featured.length < 2) return

    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % featured.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const heroMovie = featured[activeHero] ?? movies[0]

  const allGenres = useMemo(
    () => [...new Set(movies.flatMap((movie) => movie.genres))].sort(),
    [],
  )

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')

    return movies.filter((movie) => {
      const searchableText = [
        movie.title,
        movie.year,
        movie.overview,
        ...movie.genres,
        ...movie.cast,
      ].join(' ').toLocaleLowerCase('vi')

      const matchesSearch = !query || searchableText.includes(query)

      const matchesGenre =
        !selectedGenre ||
        movie.genres.some((genre) =>
          genre.toLocaleLowerCase('vi').includes(
            selectedGenre.toLocaleLowerCase('vi'),
          ),
        )

      const matchesWatchlist =
        !showWatchlist || watchlist.includes(movie.id)

      return matchesSearch && matchesGenre && matchesWatchlist
    })
  }, [search, selectedGenre, showWatchlist, watchlist])

  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi')

    if (!query) return []

    return movies
      .filter((movie) =>
        movie.title.toLocaleLowerCase('vi').includes(query),
      )
      .sort((a, b) => {
        const aStarts = a.title.toLocaleLowerCase('vi').startsWith(query)
        const bStarts = b.title.toLocaleLowerCase('vi').startsWith(query)

        if (aStarts !== bStarts) return aStarts ? -1 : 1
        return b.popularity - a.popularity
      })
      .slice(0, 6)
  }, [search])

  useEffect(() => {
    if (pendingScrollMovieId === null) return

    const movieExists = filteredMovies.some(
      (movie) => movie.id === pendingScrollMovieId,
    )

    if (!movieExists) return

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`movie-card-${pendingScrollMovieId}`)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })

      setPendingScrollMovieId(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pendingScrollMovieId, filteredMovies])

  useEffect(() => {
    if (!searchFocused) return

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target

      if (
        target instanceof Element &&
        !target.closest('.search-container')
      ) {
        setSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [searchFocused])

  const toggleWatchlist = (id: number) => {
    setWatchlist((current) =>
      current.includes(id)
        ? current.filter((movieId) => movieId !== id)
        : [...current, id],
    )
  }

  const selectMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsWatching(false)
    setSearchFocused(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectSuggestion = (movie: Movie) => {
    setSearch(movie.title)
    setSelectedGenre('')
    setShowWatchlist(false)
    setSelectedMovie(null)
    setIsWatching(false)
    setSearchFocused(false)
    setPendingScrollMovieId(movie.id)
  }

  const handleAssistantSubmit = async (
    prompt: string,
    history: AssistantHistoryMessage[],
  ): Promise<{ reply: string; movies: Movie[] }> => {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [...history, { role: 'user', content: prompt }].slice(-12),
        movies: movies.slice(0, 100).map((movie) => ({
          id: movie.id,
          title: movie.title,
          year: movie.year,
          genres: movie.genres,
          rating: movie.rating,
          runtime: movie.runtime,
          overview: movie.overview,
        })),
      }),
    })

    const data = (await response.json()) as {
      reply?: string
      movieIds?: number[]
      error?: string
    }

    if (!response.ok) {
      throw new Error(data.error || 'Không thể kết nối CineScope AI.')
    }

    const recommendedMovies = Array.isArray(data.movieIds)
      ? data.movieIds
          .map((id) => movies.find((movie) => movie.id === id))
          .filter((movie): movie is Movie => Boolean(movie))
      : []

    return {
      reply: data.reply || 'Anh kể thêm một chút nhé, để Cine hiểu hơn.',
      movies: recommendedMovies,
    }
  }

  const handleAuthSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)

    try {
      if (authMode === 'register') {
        const credential = await createUserWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword,
        )

        await updateProfile(credential.user, {
          displayName: authName.trim(),
        })

        setUser(credential.user)
      } else {
        await signInWithEmailAndPassword(
          auth,
          authEmail.trim(),
          authPassword,
        )
      }

      setAccountOpen(false)
      setAuthPassword('')
    } catch (error) {
      const code = (error as { code?: string }).code

      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Email này đã được đăng ký.',
        'auth/invalid-email': 'Địa chỉ email chưa hợp lệ.',
        'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        'auth/user-not-found': 'Không tìm thấy tài khoản này.',
        'auth/wrong-password': 'Mật khẩu không đúng.',
        'auth/too-many-requests': 'Anh thử lại sau ít phút nhé.',
        'auth/operation-not-allowed':
          'Hãy bật Email/Password trong Firebase Authentication.',
      }

      setAuthError(
        messages[code || ''] ||
          'Không thể đăng nhập. Anh kiểm tra thông tin nhé.',
      )
    } finally {
      setAuthBusy(false)
    }
  }

  const handleStartWatching = () => {
    if (!user) {
      setAccountOpen(true)
      setAuthError('Anh đăng nhập để xem phim nhé.')
      return
    }

    setIsWatching(true)
  }

  if (!movies.length) {
    return (
      <main className="empty-app">
        <h1>Chưa có dữ liệu phim</h1>
        <p>Anh kiểm tra file src/data/movies.json nhé.</p>
      </main>
    )
  }

  return (
    <main className="app-shell" id="home">
      <header className="navbar">
        <a
          className="logo"
          href="#home"
          onClick={() => {
            setSelectedMovie(null)
            setIsWatching(false)
            setSearchFocused(false)
          }}
        >
          <span className="logo-symbol">
            C<span>S</span>
          </span>
          <span className="logo-text">
            CINE<span>SCOPE</span>
            <small>YOUR MOVIE UNIVERSE</small>
          </span>
        </a>

        <nav className="nav-links">
          <button
            className={!selectedGenre && !showWatchlist ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setSelectedMovie(null)
              setShowWatchlist(false)
              setSelectedGenre('')
              setSearch('')
              setSearchFocused(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Trang chủ
          </button>

          <button
            className="nav-item"
            onClick={() => {
              setSelectedMovie(null)
              setSearchFocused(false)
              document
                .getElementById('movies')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Khám phá
          </button>

          <button
            className={showWatchlist ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setSelectedMovie(null)
              setShowWatchlist(true)
              setSearchFocused(false)
              document
                .getElementById('movies')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Danh sách của tôi
          </button>
        </nav>

        <div className="nav-actions">
          <div className="search-container">
            <label className="search-field" aria-label="Tìm kiếm phim">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>

              <input
                value={search}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setShowWatchlist(false)
                  setSelectedMovie(null)
                  setSearchFocused(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchFocused(false)
                    ;(event.target as HTMLInputElement).blur()
                  }

                  if (
                    event.key === 'Enter' &&
                    searchSuggestions.length > 0
                  ) {
                    event.preventDefault()
                    handleSelectSuggestion(searchSuggestions[0])
                  }
                }}
                placeholder="Tìm kiếm phim..."
                autoComplete="off"
                aria-label="Nhập tên phim cần tìm"
                aria-expanded={searchFocused && search.trim().length > 0}
                aria-controls="movie-search-suggestions"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  aria-label="Xóa tìm kiếm"
                  onClick={() => {
                    setSearch('')
                    setSearchFocused(true)
                  }}
                >
                  ×
                </button>
              )}
            </label>

            {searchFocused && search.trim() && (
              <div
                className="search-suggestions"
                id="movie-search-suggestions"
                role="listbox"
              >
                {searchSuggestions.length > 0 ? (
                  searchSuggestions.map((movie) => (
                    <button
                      type="button"
                      key={movie.id}
                      className="search-suggestion"
                      role="option"
                      aria-selected="false"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectSuggestion(movie)}
                    >
                      <img
                        src={movie.poster}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK
                        }}
                      />

                      <span className="search-suggestion-info">
                        <span className="search-suggestion-title">
                          {movie.title}
                        </span>
                        <span className="search-suggestion-meta">
                          {movie.year}
                          {' · '}
                          {movie.genres.slice(0, 2).join(', ')}
                        </span>
                        <span className="search-suggestion-meta">
                          ★ {movie.rating.toFixed(1)}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="search-suggestion-empty">
                    Không tìm thấy phim có tên phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="account-button"
            onClick={() => {
              setSearchFocused(false)

              if (user) {
                void signOut(auth)
              } else {
                setAccountOpen(true)
              }
            }}
          >
            {user
              ? `Đăng xuất (${user.displayName || user.email})`
              : 'Đăng nhập'}
          </button>
        </div>
      </header>

      {selectedMovie ? (
        <section className="movie-detail-page">
          <div
            className="detail-hero-backdrop"
            style={{
              backgroundImage: `url("${selectedMovie.backdrop}")`,
            }}
          >
            <div className="detail-gradient-overlay" />

            <div className="detail-content-wrapper">
              <span className="eyebrow">CINESCOPE FEATURED MOVIE</span>
              <h1 className="detail-title">{selectedMovie.title}</h1>

              <div className="detail-meta-row">
                <span className="rating-tag">
                  ★ {selectedMovie.rating.toFixed(1)}
                </span>
                <span>{selectedMovie.year}</span>
                {selectedMovie.runtime > 0 && (
                  <span>{selectedMovie.runtime} phút</span>
                )}
              </div>

              <p className="detail-overview">
                {selectedMovie.overview}
              </p>

              <div className="detail-actions">
                <button
                  className="watch-button"
                  onClick={handleStartWatching}
                >
                  ▶ Xem phim ngay
                </button>

                <button
                  className={
                    watchlist.includes(selectedMovie.id)
                      ? 'round-button saved'
                      : 'round-button'
                  }
                  onClick={() => toggleWatchlist(selectedMovie.id)}
                  aria-label="Lưu phim"
                >
                  {watchlist.includes(selectedMovie.id) ? '♥' : '♡'}
                </button>

                <button
                  className="back-to-home-btn"
                  onClick={() => {
                    setSelectedMovie(null)
                    setIsWatching(false)
                  }}
                >
                  Quay lại
                </button>
              </div>

              <div className="detail-extra-info">
                <p>
                  <strong>Thể loại:</strong>{' '}
                  {selectedMovie.genres.join(' · ')}
                </p>
                {selectedMovie.directors.length > 0 && (
                  <p>
                    <strong>Đạo diễn:</strong>{' '}
                    {selectedMovie.directors.join(', ')}
                  </p>
                )}
                {selectedMovie.cast.length > 0 && (
                  <p>
                    <strong>Diễn viên:</strong>{' '}
                    {selectedMovie.cast.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isWatching && (
            <div className="movie-player-section-wrapper">
              <MoviePlayer
                movie={selectedMovie}
                onClose={() => setIsWatching(false)}
              />
            </div>
          )}

          <MovieDetailTabs movie={selectedMovie} user={user} />
        </section>
      ) : (
        <>
          <section className="hero" id="hero">
            <div
              key={heroMovie.id}
              className="hero-background"
              style={{
                backgroundImage: `url("${heroMovie.backdrop}")`,
              }}
            />
            <div className="hero-gradient" />

            <div className="hero-copy">
              <p className="eyebrow">
                <span />
                CINESCOPE ORIGINALS
              </p>

              <h1>{heroMovie.title}</h1>
              <p className="hero-genres">
                {heroMovie.genres.slice(0, 3).join(' · ')}
              </p>

              <div className="hero-tags">
                <span className="rating-tag">
                  ★ {heroMovie.rating.toFixed(1)}
                </span>
                <span>{heroMovie.year}</span>
                {heroMovie.runtime > 0 && (
                  <span>{heroMovie.runtime} phút</span>
                )}
              </div>

              <p className="hero-overview">{heroMovie.overview}</p>

              <div className="hero-buttons">
                <button
                  className="watch-button"
                  onClick={() => selectMovie(heroMovie)}
                >
                  ▶ Khám phá phim
                </button>

                <button
                  className={
                    watchlist.includes(heroMovie.id)
                      ? 'round-button saved'
                      : 'round-button'
                  }
                  onClick={() => toggleWatchlist(heroMovie.id)}
                  aria-label="Lưu phim nổi bật"
                >
                  {watchlist.includes(heroMovie.id) ? '♥' : '♡'}
                </button>
              </div>
            </div>

            <div className="hero-bottom">
              <div className="top-ten">
                <p className="top-ten-title">NỔI BẬT HÔM NAY</p>

                <div className="hero-thumbnails">
                  {featured.map((movie, index) => (
                    <button
                      key={movie.id}
                      className={
                        activeHero === index
                          ? 'hero-thumb active'
                          : 'hero-thumb'
                      }
                      onClick={() => setActiveHero(index)}
                      aria-label={`Xem phim nổi bật ${movie.title}`}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="category-section">
            <div className="section-topline">
              <div>
                <p className="eyebrow">TÌM THEO THỂ LOẠI</p>
                <h2>Chọn thế giới anh muốn khám phá</h2>
              </div>
            </div>

            <div className="genre-pills">
              <button
                className={!selectedGenre ? 'genre-pill active' : 'genre-pill'}
                onClick={() => setSelectedGenre('')}
              >
                Tất cả
              </button>

              {allGenres.map((genre) => (
                <button
                  key={genre}
                  className={
                    selectedGenre === genre
                      ? 'genre-pill active'
                      : 'genre-pill'
                  }
                  onClick={() => {
                    setSelectedGenre(genre)
                    setShowWatchlist(false)
                    document
                      .getElementById('movies')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          <section className="catalog-section" id="movies">
            <div className="section-topline">
              <div>
                <p className="eyebrow">THƯ VIỆN CINESCOPE</p>
                <h2>
                  {showWatchlist
                    ? 'Danh sách của tôi'
                    : selectedGenre || search
                      ? 'Kết quả khám phá'
                      : 'Khám phá phim'}
                </h2>
              </div>

              <span className="movie-count">
                {filteredMovies.length} phim
              </span>
            </div>

            <div className="catalog-tools">
              <button
                className={
                  showWatchlist
                    ? 'watchlist-filter active'
                    : 'watchlist-filter'
                }
                onClick={() => setShowWatchlist((current) => !current)}
              >
                {showWatchlist ? '✓ Đang xem phim đã lưu' : '♡ Phim đã lưu'}
              </button>
            </div>

            {filteredMovies.length > 0 ? (
              <div className="movie-grid">
                {filteredMovies.slice(0, 48).map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    saved={watchlist.includes(movie.id)}
                    onSelect={selectMovie}
                    onToggleSave={toggleWatchlist}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span>⌕</span>
                <h3>Chưa tìm thấy phim phù hợp</h3>
                <p>Thử thay đổi từ khóa hoặc bộ lọc của anh nhé.</p>
                <button
                  className="watch-button"
                  onClick={() => {
                    setSearch('')
                    setSelectedGenre('')
                    setShowWatchlist(false)
                    setPendingScrollMovieId(null)
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <CineScopeBot
        onSubmit={handleAssistantSubmit}
        onSelectMovie={selectMovie}
      />

      <footer className="footer">
        <a
          className="logo footer-logo"
          href="#home"
          onClick={() => {
            setSelectedMovie(null)
            setIsWatching(false)
          }}
        >
          <span className="logo-symbol">
            C<span>S</span>
          </span>
          <span className="logo-text">
            CINE<span>SCOPE</span>
          </span>
        </a>
        <p>Một thư viện điện ảnh. Hàng nghìn câu chuyện.</p>
        <span className="footer-note">Dự án giao diện cá nhân</span>
        <small className="disclaimer">
          This product uses TMDB-derived metadata and is not endorsed or
          certified by TMDB.
        </small>
      </footer>

      {accountOpen && !user && (
        <div
          className="modal-backdrop account-backdrop"
          onClick={() => setAccountOpen(false)}
        >
          <section
            className="auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setAccountOpen(false)}
              aria-label="Đóng"
            >
              ×
            </button>

            <div className="auth-brand">
              <span className="logo-symbol">
                C<span>S</span>
              </span>
              <span className="logo-text">
                CINE<span>SCOPE</span>
              </span>
            </div>

            <h2>
              {authMode === 'login'
                ? 'Chào mừng trở lại'
                : 'Tạo tài khoản'}
            </h2>

            <p className="auth-subtitle">
              Đăng nhập để sử dụng tính năng xem phim.
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Họ và tên
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Tên hiển thị"
                    required
                  />
                </label>
              )}

              <label>
                Email
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                Mật khẩu
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  minLength={6}
                  required
                />
              </label>

              {authError && <p className="auth-error">{authError}</p>}

              <button
                className="watch-button auth-submit"
                type="submit"
                disabled={authBusy}
              >
                {authBusy
                  ? 'Đang xử lý...'
                  : authMode === 'login'
                    ? 'Đăng nhập'
                    : 'Tạo tài khoản'}
              </button>
            </form>

            <p className="auth-switch">
              {authMode === 'login'
                ? 'Chưa có tài khoản?'
                : 'Đã có tài khoản?'}{' '}
              <button
                onClick={() => {
                  setAuthMode((current) =>
                    current === 'login' ? 'register' : 'login',
                  )
                  setAuthError('')
                }}
              >
                {authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </section>
        </div>
      )}
    </main>
  )
}

function MovieCard({
  movie,
  saved,
  onSelect,
  onToggleSave,
}: {
  movie: Movie
  saved: boolean
  onSelect: (movie: Movie) => void
  onToggleSave: (id: number) => void
}) {
  return (
    <article
      className="movie-card"
      id={`movie-card-${movie.id}`}
    >
      <button
        className="poster-button"
        onClick={() => onSelect(movie)}
        aria-label={`Xem chi tiết phim ${movie.title}`}
      >
        <div className="poster-frame">
          <img
            src={movie.poster}
            alt={movie.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK
            }}
          />

          <div className="poster-overlay">
            <span className="poster-hover-btn">Chi tiết ↗</span>
          </div>

          <span className="poster-rating">
            ★ {movie.rating.toFixed(1)}
          </span>
        </div>

        <h3>{movie.title}</h3>
        <p>
          {movie.year} · {movie.genres.slice(0, 2).join(', ')}
        </p>
      </button>

      <button
        className={saved ? 'save-button saved' : 'save-button'}
        onClick={() => onToggleSave(movie.id)}
        title={saved ? 'Bỏ lưu phim' : 'Lưu phim'}
        aria-label={saved ? 'Bỏ lưu phim' : 'Lưu phim'}
      >
        {saved ? '♥' : '♡'}
      </button>
    </article>
  )
}
