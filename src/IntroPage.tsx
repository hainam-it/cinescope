import { useState } from 'react'
import App from './App'
import './IntroPage.css'

const FEATURES = [
  {
    step: '01',
    title: 'Khám phá kho phim',
    description: 'Thư viện phim phong phú, cập nhật liên tục các tác phẩm điện ảnh đặc sắc trong và ngoài nước.'
  },
  {
    step: '02',
    title: 'Phân loại thông minh',
    description: 'Dễ dàng lọc phim theo thể loại, năm phát hành, quốc gia hoặc xu hướng người xem.'
  },
  {
    step: '03',
    title: 'Tủ phim cá nhân',
    description: 'Lưu lại danh sách các bộ phim yêu thích để thưởng thức bất cứ khi nào bạn có thời gian.'
  }
]

// Dải ảnh poster đại diện cho không gian điện ảnh
const POSTER_STRIP = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800',
    alt: 'Cinema Atmosphere'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800',
    alt: 'Movie Theater'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800',
    alt: 'Film Production'
  }
]

export default function IntroPage() {
  const [entered, setEntered] = useState(false)

  if (entered) {
    return <App />
  }

  return (
    <div className="intro-container">
      {/* Background Lighting Effects */}
      <div className="intro-bg-grid" aria-hidden="true" />
      <div className="intro-glow-orb orb-1" aria-hidden="true" />
      <div className="intro-glow-orb orb-2" aria-hidden="true" />

      {/* Navigation / Header */}
      <header className="intro-navbar">
        <div className="intro-brand">
          <span className="brand-logo">CS</span>
          <span className="brand-name">CINESCOPE</span>
        </div>
        <button className="intro-btn-secondary" onClick={() => setEntered(true)}>
          Vào ứng dụng
        </button>
      </header>

      {/* Hero Section */}
      <main className="intro-hero">
        <section className="hero-text-content">
          <span className="hero-badge">Trải nghiệm điện ảnh</span>
          
          <h1 className="hero-title">
            Thế giới phim ảnh <br />
            <span>ngay trong tầm tay bạn.</span>
          </h1>

          <p className="hero-description">
            CineScope giúp bạn dễ dàng tìm kiếm, theo dõi và lưu trữ những bộ phim yêu thích. 
            Không gian giải trí tối giản, tập trung hoàn toàn vào trải nghiệm xem của bạn.
          </p>

          <div className="hero-actions">
            <button className="intro-btn-primary" onClick={() => setEntered(true)}>
              Khám phá ngay
              <svg className="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </section>

        {/* Dynamic Image Strip Visual */}
        <section className="hero-visual">
          <div className="image-strip-container">
            {POSTER_STRIP.map((poster, index) => (
              <div key={poster.id} className={`strip-card card-${index + 1}`}>
                <img src={poster.url} alt={poster.alt} loading="lazy" />
                <div className="strip-overlay" />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Features Grid */}
      <section className="intro-features">
        <div className="features-grid">
          {FEATURES.map((item) => (
            <div className="feature-card" key={item.step}>
              <span className="feature-step">{item.step}</span>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="intro-footer">
        <p>© {new Date().getFullYear()} CineScope. Tất cả quyền được bảo lưu.</p>
        <div className="footer-links">
          <span>Tối giản</span>
          <span>•</span>
          <span>Hiện đại</span>
          <span>•</span>
          <span>Tiện lợi</span>
        </div>
      </footer>
    </div>
  )
}