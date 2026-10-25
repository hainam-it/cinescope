import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User
} from 'firebase/auth'
import { auth } from './firebase'
import movieData from './data/movies.json'
import MoviePlayer from './components/MoviePlayer'
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
    poster: item.posterPath ? `${IMAGE_BASE}w500${item.posterPath}` : item.backdropPath ? `${IMAGE_BASE}w780${item.backdropPath}` : FALLBACK,
    backdrop: item.backdropPath ? `${IMAGE_BASE}original${item.backdropPath}` : item.posterPath ? `${IMAGE_BASE}w780${item.posterPath}` : FALLBACK,
    overview: item.overview || 'Chưa có mô tả cho bộ phim này.',
    rating: item.rating ?? 0,
    popularity: item.popularity ?? 0,
    runtime: item.runtime ?? 0,
    directors: item.directors ?? [],
    cast: item.cast ?? [],
  }))
  .sort((a, b) => b.popularity - a.popularity)

const featured = movies.slice(0, 6)

const categoryCards = [
  { title: 'Hành động', subtitle: 'Nhịp phim nghẹt thở', genre: 'Action', className: 'cat-red' },
  { title: 'Phiêu lưu', subtitle: 'Bước vào thế giới mới', genre: 'Adventure', className: 'cat-olive' },
  { title: 'Hài hước', subtitle: 'Một chút vui vẻ', genre: 'Comedy', className: 'cat-purple' },
  { title: 'Chính kịch', subtitle: 'Những câu chuyện sâu sắc', genre: 'Drama', className: 'cat-orange' },
  { title: 'Khoa học viễn tưởng', subtitle: 'Vượt khỏi giới hạn', genre: 'Science Fiction', className: 'cat-teal' },
  { title: 'Kinh dị', subtitle: 'Dành cho người can đảm', genre: 'Horror', className: 'cat-gray' },
  { title: 'Lãng mạn', subtitle: 'Chạm đến cảm xúc', genre: 'Romance', className: 'cat-pink' },
]

export default function App() {
  const [activeHero, setActiveHero] = useState(0)
  // --- THÊM ĐOẠN NÀY VÀO ĐỂ TỰ ĐỘNG CHẠY SLIDE SAU 3 GIÂY ---
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % featured.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  const playerRef = useRef<HTMLDivElement>(null)
  
  // Auth State
  const [user, setUser] = useState<User | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(true)
  const [activeNav, setActiveNav] = useState('Trang chủ')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  // State cho thông báo giữa màn hình (thay cho alert)
  const [modalMessage, setModalMessage] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return () => unsubscribe()
  }, [])

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    setAuthBusy(true)
    try {
      await setPersistence(auth, rememberLogin ? browserLocalPersistence : browserSessionPersistence)
      if (authMode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword)
        await updateProfile(credential.user, { displayName: authName.trim() })
        setUser({ ...credential.user, displayName: authName.trim() } as User)
      } else {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword)
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
        'auth/too-many-requests': 'Bạn thử lại sau ít phút nhé.',
        'auth/operation-not-allowed': 'Hãy bật Email/Password trong Firebase Authentication.'
      }
      setAuthError(messages[code || ''] || 'Không thể xác thực. Kiểm tra thông tin và thử lại.')
    } finally {
      setAuthBusy(false)
    }
  }

  const heroMovie = featured[activeHero] ?? movies[0]
  
  const allGenres = useMemo(() => 
    [...new Set(movies.flatMap((movie) => movie.genres))].sort((a, b) => a.localeCompare(b)), 
  [])

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase()
    return movies.filter((movie) => {
      const text = `${movie.title} ${movie.overview} ${movie.genres.join(' ')} ${movie.cast.join(' ')} ${movie.year}`.toLowerCase()
      const matchesQuery = !query || text.includes(query)
      const matchesGenre = !selectedGenre || movie.genres.includes(selectedGenre)
      const matchesSaved = !showWatchlist || watchlist.includes(movie.id)
      return matchesQuery && matchesGenre && matchesSaved
    })
  }, [search, selectedGenre, showWatchlist, watchlist])

  const toggleWatchlist = (id: number) => {
    setWatchlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const jumpToMovies = () => {
    setShowWatchlist(false)
    document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth' })
  }

  const openWatchlist = () => {
    setShowWatchlist(true)
    document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setIsWatching(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // BẬT POPUP THÔNG BÁO GIỮA MÀN HÌNH NẾU CHƯA ĐĂNG NHẬP
  const handleStartWatching = () => {
    if (!user) {
      setModalMessage('Vui lòng đăng nhập tài khoản CineScope để xem phim nhé!')
      return
    }

    setIsWatching(true)
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  if (!movies.length) {
    return <main className="empty-app"><h1>Chưa có dữ liệu phim</h1><p>Kiểm tra file src/data/movies.json.</p></main>
  }

  return (
    <main className="app-shell">
      {/* NAVBAR */}
      <header className="navbar">
        <a className="logo" href="#home" onClick={() => { setSelectedMovie(null); setIsWatching(false); }} aria-label="CineScope trang chủ">
          <span className="logo-symbol">C<span>S</span></span>
          <span className="logo-text">CINE<span>SCOPE</span><small>YOUR MOVIE UNIVERSE</small></span>
        </a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <button className={activeNav === 'Trang chủ' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Trang chủ'); setSelectedMovie(null); setIsWatching(false); setShowWatchlist(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Trang chủ</button>
          <button className={activeNav === 'Khám phá' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Khám phá'); setSelectedMovie(null); setIsWatching(false); jumpToMovies() }}>Khám phá</button>
          <button className={activeNav === 'Phim lẻ' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Phim lẻ'); setSelectedMovie(null); setIsWatching(false); setSelectedGenre(''); jumpToMovies() }}>Phim lẻ</button>
          <button className={activeNav === 'Hoạt hình' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Hoạt hình'); setSelectedMovie(null); setIsWatching(false); setSelectedGenre('Animation'); jumpToMovies() }}>Hoạt hình</button>
          <button className={activeNav === 'Danh sách của tôi' ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav('Danh sách của tôi'); setSelectedMovie(null); setIsWatching(false); openWatchlist() }}>Danh sách của tôi</button>
        </nav>
        <div className="nav-actions">
          <label className="search-field" aria-label="Tìm kiếm phim">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setShowWatchlist(false); setSelectedMovie(null); }} placeholder="Tìm phim..." />
            {search && <button className="clear-search" onClick={() => setSearch('')} aria-label="Xóa tìm kiếm">×</button>}
          </label>
          <div
            className="account-wrap"
            onMouseEnter={() => { if (window.matchMedia('(hover: hover)').matches && user) setAccountOpen(true) }}
            onMouseLeave={() => { if (window.matchMedia('(hover: hover)').matches && user) setAccountOpen(false) }}
          >
            <button className={user ? 'account-button signed-in' : 'account-button'} onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen}>
              <span className="account-avatar">
                {user ? (
                  (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </span>
              <span className="account-label">
                {user ? (user.displayName || user.email?.split('@')[0] || 'Tài khoản') : 'Đăng nhập'}
              </span>
            </button>
            {accountOpen && user && (
              <div className="account-dropdown">
                <div className="account-user-info">
                  <strong>{user.displayName || user.email?.split('@')[0]}</strong>
                  <span>{user.email}</span>
                </div>
                <button onClick={() => { setSelectedMovie(null); setIsWatching(false); openWatchlist(); }}>Danh sách phim của tôi</button>
                <button 
                  className="logout-action" 
                  onClick={async () => { 
                    await signOut(auth); 
                    setAccountOpen(false); 
                    setUser(null);
                    setSelectedMovie(null); 
                    setIsWatching(false); 
                    setShowWatchlist(false); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">☰</button>
        </div>
      </header>

      {/* CHI TIẾT PHIM */}
      {selectedMovie ? (
        <section className="movie-detail-page">
          <div className="detail-hero-backdrop" style={{ backgroundImage: `url("${selectedMovie.backdrop}")` }}>
            <div className="detail-gradient-overlay" />
            <div className="detail-content-wrapper">
              <span className="eyebrow">CINESCOPE FEATURED MOVIE</span>
              <h1 className="detail-title">{selectedMovie.title}</h1>
              
              <div className="detail-meta-row">
                <span className="rating-tag">★ {selectedMovie.rating.toFixed(1)}</span>
                <span>{selectedMovie.year}</span>
                {selectedMovie.runtime > 0 && <span>{selectedMovie.runtime} phút</span>}
              </div>
              <p className="detail-overview">{selectedMovie.overview}</p>
              <div className="detail-actions">
                <button className="watch-button" onClick={handleStartWatching}>
                  <span className="play-icon">▶</span> Xem phim ngay
                </button>
                <button 
                  className={watchlist.includes(selectedMovie.id) ? 'round-button saved' : 'round-button'} 
                  onClick={() => toggleWatchlist(selectedMovie.id)}
                  title="Thêm vào danh sách yêu thích"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={watchlist.includes(selectedMovie.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <button className="back-to-home-btn" onClick={() => { setSelectedMovie(null); setIsWatching(false); }}>
                  Quay lại trang chủ
                </button>
              </div>
              <div className="detail-extra-info">
                <p><strong>Thể loại:</strong> {selectedMovie.genres.join(' · ')}</p>
                {selectedMovie.directors.length > 0 && <p><strong>Đạo diễn:</strong> {selectedMovie.directors.join(', ')}</p>}
                {selectedMovie.cast.length > 0 && <p><strong>Diễn viên:</strong> {selectedMovie.cast.join(', ')}</p>}
              </div>
            </div>
          </div>
          {isWatching && (
            <div ref={playerRef} className="movie-player-section-wrapper">
              <MoviePlayer movie={selectedMovie} onClose={() => setIsWatching(false)} />
            </div>
          )}
        </section>
      ) : (
        <>
          {/* HERO SECTION TRANG CHỦ */}
          <section className="hero" id="home">
            <div key={heroMovie.id} className="hero-background" style={{ backgroundImage: `url("${heroMovie.backdrop}")` }} />
            <div className="hero-gradient" />
            
            <div className="hero-copy">
              <p className="eyebrow"><span></span> CINESCOPE ORIGINALS</p>
              <h1>{heroMovie.title}</h1>
              <p className="hero-genres">{heroMovie.genres.slice(0, 3).join(' · ')}</p>
              <div className="hero-tags">
                <span className="rating-tag">★ {heroMovie.rating.toFixed(1)}</span>
                <span>{heroMovie.year}</span>
                {heroMovie.runtime > 0 && <span>{heroMovie.runtime} phút</span>}
                <span className="quality-tag">4K HDR</span>
              </div>
              <p className="hero-overview">{heroMovie.overview}</p>
              
              <div className="hero-buttons">
                <button className="watch-button" onClick={() => handleSelectMovie(heroMovie)}>
                  <span className="play-icon">▶</span> Khám phá phim
                </button>
                <button 
                  className={watchlist.includes(heroMovie.id) ? 'round-button saved' : 'round-button'} 
                  onClick={() => toggleWatchlist(heroMovie.id)} 
                  title="Thêm vào danh sách yêu thích"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={watchlist.includes(heroMovie.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="hero-bottom">
              <div className="top-ten">
                <p className="top-ten-title">NỔI BẬT HÔM NAY</p>
                <div className="hero-thumbnails">
                  {featured.map((movie, index) => (
                    <button key={movie.id} className={activeHero === index ? 'hero-thumb active' : 'hero-thumb'} onClick={() => setActiveHero(index)}>
                      <img src={movie.poster} alt={movie.title} onError={(e) => { e.currentTarget.src = FALLBACK }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES SECTION */}
          <section className="category-section">
            <div className="section-topline">
              <div>
                <p className="eyebrow">TÌM THEO THỂ LOẠI</p>
                <h2>Mở ra không gian mới</h2>
              </div>
              <button className="text-link" onClick={jumpToMovies}>Tất cả phim <span>↗</span></button>
            </div>
            <div className="category-track">
              {categoryCards.map((category) => (
                <button key={category.genre} className={`category-card ${category.className}`} onClick={() => { setSelectedGenre(category.genre); jumpToMovies() }}>
                  <span className="category-subtitle">{category.subtitle}</span>
                  <span className="category-name">{category.title}</span>
                  <span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          <div className="ornament-divider"><span>✳</span></div>

          {/* CATALOG SECTION */}
          <section className="catalog-section" id="movies">
            <div className="section-topline">
              <div>
                <p className="eyebrow">THƯ VIỆN CINESCOPE</p>
                <h2>{showWatchlist ? 'Danh sách của tôi' : 'Khám phá phim'}</h2>
              </div>
              <span className="movie-count">{filteredMovies.length} phim</span>
            </div>
            <div className="catalog-tools">
              <div className="genre-pills">
                <button className={selectedGenre === '' ? 'genre-pill active' : 'genre-pill'} onClick={() => setSelectedGenre('')}>Tất cả</button>
                {allGenres.slice(0, 10).map((genre) => (
                  <button key={genre} className={selectedGenre === genre ? 'genre-pill active' : 'genre-pill'} onClick={() => setSelectedGenre(genre)}>{genre}</button>
                ))}
              </div>
              <button className={showWatchlist ? 'watchlist-filter active' : 'watchlist-filter'} onClick={() => setShowWatchlist(!showWatchlist)}>
                {showWatchlist ? '✓ Danh sách của tôi' : '♡ Phim đã lưu'}
              </button>
            </div>
            {filteredMovies.length ? (
              <div className="movie-grid">
                {filteredMovies.slice(0, 48).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} saved={watchlist.includes(movie.id)} onSelect={handleSelectMovie} onToggleSave={toggleWatchlist} />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span>⌕</span>
                <h3>Chưa tìm thấy phim phù hợp</h3>
                <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                <button className="watch-button" onClick={() => { setSearch(''); setSelectedGenre(''); setShowWatchlist(false) }}>Xóa bộ lọc</button>
              </div>
            )}
            {filteredMovies.length > 48 && <p className="catalog-note">Đang hiển thị 48 trong số {filteredMovies.length} phim.</p>}
          </section>
        </>
      )}

      {/* FOOTER */}
      <footer className="footer">
        <a className="logo footer-logo" href="#home" onClick={() => { setSelectedMovie(null); setIsWatching(false); }}>
          <span className="logo-symbol">C<span>S</span></span>
          <span className="logo-text">CINE<span>SCOPE</span></span>
        </a>
        <p>Một thư viện điện ảnh. Hàng nghìn câu chuyện.</p>
        <span className="footer-note">Dự án giao diện cá nhân</span>
        <small className="disclaimer">Dữ liệu từ TMDB[cite: 1]. This product uses TMDB-derived metadata and is not endorsed or certified by TMDB.</small>
      </footer>

      {/* CUSTOM ALERT MODAL (Ô THÔNG BÁO Ở GIỮA MÀN HÌNH) */}
      {modalMessage && (
        <div className="modal-backdrop" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, background: 'rgba(0,0,0,0.8)' }} onClick={() => setModalMessage(null)}>
          <div className="auth-modal" style={{ textAlign: 'center', maxWidth: '400px', width: '90%', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
            <div className="auth-brand" style={{ justifyContent: 'center', marginBottom: '15px' }}>
              <span className="logo-symbol">C<span>S</span></span>
              <span className="logo-text">CINE<span>SCOPE</span></span>
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', color: '#fff' }}>Thông báo</h3>
            <p style={{ color: '#aaa', marginBottom: '25px', lineHeight: '1.5' }}>{modalMessage}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="watch-button" 
                style={{ flex: 1, padding: '10px' }} 
                onClick={() => { 
                  setModalMessage(null); 
                  setAccountOpen(true); // Bật luôn form đăng nhập lên cho tiện
                }}
              >
                Đăng nhập ngay
              </button>
              <button 
                className="back-to-home-btn" 
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }} 
                onClick={() => setModalMessage(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {accountOpen && !user && (
        <div className="modal-backdrop account-backdrop" onClick={() => { setAccountOpen(false); setAuthError('') }}>
          <section className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => { setAccountOpen(false); setAuthError('') }}>×</button>
            <div className="auth-brand">
              <span className="logo-symbol">C<span>S</span></span>
              <span className="logo-text">CINE<span>SCOPE</span></span>
            </div>
            <h2>{authMode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
            <p className="auth-subtitle">Đăng nhập để xem phim và lưu giữ các bộ phim yêu thích của bạn.</p>
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && <label>Họ và tên<input value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Tên hiển thị" required /></label>}
              <label>Email<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" required /></label>
              <label>Mật khẩu
                <div className="password-field">
                  <input type={showPassword ? 'text' : 'password'} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" minLength={6} required />
                  <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
                </div>
              </label>
              {authMode === 'login' && (
                <label className="remember-login">
                  <input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} /> Ghi nhớ đăng nhập
                </label>
              )}
              {authError && <p className="auth-error">{authError}</p>}
              <button className="watch-button auth-submit" type="submit" disabled={authBusy}>
                {authBusy ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>
            <p className="auth-switch">
              {authMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError('') }}>
                {authMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </section>
        </div>
      )}
    </main>
  )
}

function MovieCard({ movie, saved, onSelect, onToggleSave }: { movie: Movie, saved: boolean, onSelect: (movie: Movie) => void, onToggleSave: (id: number) => void }) {
  return (
    <article className="movie-card">
      <button className="poster-button" onClick={() => onSelect(movie)}>
        <div className="poster-frame">
          <img src={movie.poster} alt={movie.title} loading="lazy" onError={(e) => { e.currentTarget.src = FALLBACK }} />
          <div className="poster-overlay">
            <span className="poster-hover-btn">Chi tiết ↗</span>
          </div>
          <span className="poster-rating">★ {movie.rating.toFixed(1)}</span>
        </div>
        <h3>{movie.title}</h3>
        <p>{movie.year} <span>•</span> {movie.genres.slice(0, 2).join(', ')}</p>
      </button>
      <button className={saved ? 'save-button saved' : 'save-button'} onClick={() => onToggleSave(movie.id)} title="Lưu phim">
        <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>
    </article>
  )
}