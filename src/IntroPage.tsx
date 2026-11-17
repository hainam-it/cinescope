import { useState } from 'react'
import App from './App'
import './IntroPage.css'
const FACEBOOK_URL = 'https://www.facebook.com/link-facebook-cua-ban'

const SHOWCASE_SLIDES = [
  {
    id: 1,
    tag: '01 / KHÔNG GIAN ĐIỆN ẢNH',
    title: 'Giao diện tối giản, tập trung trọn vẹn',
    caption:
      'Loại bỏ quảng cáo và các chi tiết gây xao nhãng, tối ưu hiển thị trên nền tối dịu mắt.',
    url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000',
    alt: 'Không gian rạp chiếu phim',
  },
  {
    id: 2,
    tag: '02 / TRỢ LÝ AI CINE',
    title: 'Gợi ý phim theo đúng tâm trạng',
    caption:
      'Trò chuyện tự nhiên bằng tiếng Việt để Cine phân tích và chọn ra bộ phim hợp gu nhất.',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000',
    alt: 'Màn ảnh điện ảnh',
  },
  {
    id: 3,
    tag: '03 / TỦ PHIM CÁ NHÂN',
    title: 'Lưu trữ và theo dõi dễ dàng',
    caption:
      'Quản lý danh sách phim yêu thích và tiếp tục hành trình điện ảnh bất cứ lúc nào.',
    url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000',
    alt: 'Hậu trường điện ảnh',
  },
]

const FAQS = [
  {
    q: 'CineScope có miễn phí hoàn toàn không?',
    a: 'Có. Bạn có thể duyệt thông tin, lọc thể loại và trò chuyện cùng trợ lý AI Cine hoàn toàn miễn phí. Chỉ cần đăng ký tài khoản bằng email để mở khóa trình phát và đồng bộ danh sách yêu thích.',
  },
  {
    q: 'Trợ lý AI Cine hoạt động như thế nào?',
    a: 'Cine được tích hợp mô hình Google Gemini và kết nối trực tiếp với dữ liệu thư viện của CineScope, giúp hiểu ngữ cảnh hội thoại tiếng Việt và đề xuất đúng các tác phẩm phù hợp.',
  },
  {
    q: 'Tôi có thể lưu phim để xem sau không?',
    a: 'Có. Mỗi tác phẩm đều hỗ trợ lưu nhanh vào mục Danh sách của tôi (Watchlist) để bạn mở lại thuận tiện bất cứ khi nào có thời gian.',
  },
  {
    q: 'Website hỗ trợ những thiết bị nào?',
    a: 'CineScope được thiết kế đáp ứng (Responsive), hiển thị mượt mà trên máy tính, máy tính bảng và điện thoại di động.',
  },
]

export default function IntroPage() {
  const [entered, setEntered] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  if (entered) {
    return <App />
  }

  const currentSlide = SHOWCASE_SLIDES[activeSlide] ?? SHOWCASE_SLIDES[0]

  return (
    <div className="cs-landing">
      {/* Thanh điều hướng */}
      <header className="cs-navbar">
        <div className="cs-container cs-nav-inner">
          <a href="#top" className="cs-brand">
            <span className="cs-brand-badge">CS</span>
            <div className="cs-brand-text">
              <strong>CINESCOPE</strong>
              <span>YOUR MOVIE UNIVERSE</span>
            </div>
          </a>

          <nav className="cs-nav-links" aria-label="Điều hướng chính">
            <a href="#ai-cine">Trợ lý AI</a>
            <a href="#features">Tính năng</a>
            <a href="#faq">Hỏi đáp</a>
            <a href="#contact">Liên hệ</a>
          </nav>

          {/* Nút điều hướng 1 */}
          <button
            type="button"
            className="cs-btn-primary"
            onClick={() => setEntered(true)}
          >
            Xem phim ngay
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="cs-hero" id="top">
        <div className="cs-hero-glow" aria-hidden="true" />

        <div className="cs-container cs-hero-grid">
          <div className="cs-hero-copy">
            <div className="cs-pill">
              <span className="cs-dot" />
              Nền tảng phim trực tuyến tích hợp Gemini AI
            </div>

            <h1 className="cs-hero-title">
              Thế giới điện ảnh <span>tinh gọn trong tầm tay bạn.</span>
            </h1>

            <p className="cs-hero-desc">
              CineScope mang đến không gian giải trí tối giản, không quảng cáo làm
              phiền cùng trợ lý AI Cine giúp bạn tìm đúng bộ phim hợp tâm trạng chỉ
              trong vài giây.
            </p>

            {/* Nút điều hướng 2 + liên kết cuộn trang */}
            <div className="cs-hero-actions">
              <button
                type="button"
                className="cs-btn-primary cs-btn-lg"
                onClick={() => setEntered(true)}
              >
                Khám phá ngay →
              </button>
              <a href="#ai-cine" className="cs-btn-outline cs-btn-lg">
                Tìm hiểu thêm
              </a>
            </div>

            <div className="cs-metrics">
              <div className="cs-metric-item">
                <strong>Tối giản</strong>
                <span>Không gian tập trung</span>
              </div>
              <div className="cs-metric-sep" />
              <div className="cs-metric-item">
                <strong>AI 24/7</strong>
                <span>Gợi ý theo ngữ cảnh</span>
              </div>
              <div className="cs-metric-sep" />
              <div className="cs-metric-item">
                <strong>Đa thiết bị</strong>
                <span>Mượt mà mọi màn hình</span>
              </div>
            </div>
          </div>

          {/* Khung trình bày trực quan (chỉ chuyển slide xem thông tin, không đặt nút mở app) */}
          <div className="cs-showcase-card">
            <div className="cs-showcase-media">
              <img src={currentSlide.url} alt={currentSlide.alt} />
              <span className="cs-showcase-tag">{currentSlide.tag}</span>
            </div>

            <div className="cs-showcase-body">
              <h3>{currentSlide.title}</h3>
              <p>{currentSlide.caption}</p>

              <div className="cs-slide-switcher" role="tablist" aria-label="Chọn điểm nổi bật">
                {SHOWCASE_SLIDES.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeSlide}
                    className={
                      index === activeSlide ? 'cs-slide-tab active' : 'cs-slide-tab'
                    }
                    onClick={() => setActiveSlide(index)}
                  >
                    <span>0{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Giới thiệu Trợ lý AI Cine (thuần giới thiệu & minh họa) */}
      <section className="cs-section cs-section-alt" id="ai-cine">
        <div className="cs-container cs-ai-grid">
          <div className="cs-ai-info">
            <span className="cs-kicker">TRỢ LÝ ĐIỆN ẢNH THÔNG MINH</span>
            <h2>Không biết tối nay xem gì? Hãy trò chuyện với Cine.</h2>
            <p>
              Thay vì mất hàng chục phút lướt tìm, bạn chỉ cần mô tả thể loại yêu
              thích, tâm trạng hiện tại hoặc thời gian rảnh bằng tiếng Việt tự nhiên.
              Cine sẽ phân tích và gợi ý lựa chọn phù hợp nhất ngay bên trong ứng dụng.
            </p>
            <ul className="cs-list">
              <li>Hiểu mạch hội thoại tự nhiên để lọc sâu theo từng câu hỏi</li>
              <li>Đề xuất chính xác dựa trên thư viện phim có sẵn của hệ thống</li>
              <li>Tích hợp gọn gàng ở góc màn hình khi bạn duyệt phim</li>
            </ul>
          </div>

          <div className="cs-chat-preview" aria-label="Minh họa hội thoại với AI Cine">
            <div className="cs-chat-top">
              <span className="cs-chat-icon">✦</span>
              <div>
                <strong>Cine AI Assistant</strong>
                <small>Trực tuyến · Sẵn sàng hỗ trợ</small>
              </div>
            </div>
            <div className="cs-chat-messages">
              <div className="cs-msg user">
                Cuối tuần mình muốn tìm một bộ phim tâm lý hoặc khoa học viễn tưởng có
                chiều sâu để xem buổi tối.
              </div>
              <div className="cs-msg bot">
                Chào bạn! Mình đã chọn lọc sẵn vài tác phẩm có kịch bản cuốn hút và
                điểm đánh giá cao trong thư viện CineScope để bạn tham khảo ngay khi
                vào rạp nhé.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tính năng cốt lõi */}
      <section className="cs-section" id="features">
        <div className="cs-container">
          <div className="cs-section-head">
            <span className="cs-kicker">TRẢI NGHIỆM TOÀN DIỆN</span>
            <h2>Thiết kế tối ưu cho người yêu điện ảnh</h2>
          </div>

          <div className="cs-bento">
            <article className="cs-bento-item wide">
              <span className="cs-bento-num">01</span>
              <h3>Tìm kiếm tức thì &amp; Lọc đa chiều</h3>
              <p>
                Tra cứu nhanh theo tên tác phẩm, diễn viên hoặc phân loại theo từng thể
                loại riêng biệt với tốc độ phản hồi tức thì ngay trên giao diện.
              </p>
            </article>

            <article className="cs-bento-item">
              <span className="cs-bento-num">02</span>
              <h3>Tủ phim cá nhân</h3>
              <p>
                Lưu giữ danh sách các tác phẩm yêu thích để mở lại thuận tiện bất cứ
                khi nào rảnh rỗi.
              </p>
            </article>

            <article className="cs-bento-item">
              <span className="cs-bento-num">03</span>
              <h3>Tài khoản bảo mật</h3>
              <p>
                Đăng ký và đăng nhập nhanh gọn qua Firebase để mở khóa trình phát và
                tham gia bình luận.
              </p>
            </article>

            <article className="cs-bento-item wide">
              <span className="cs-bento-num">04</span>
              <h3>Không gian trình chiếu tập trung</h3>
              <p>
                Giao diện tối màu kết hợp sắc xanh ngọc lục bảo giúp dịu mắt khi xem
                phim vào ban đêm và loại bỏ mọi yếu tố gây xao nhãng.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="cs-section cs-section-alt" id="faq">
        <div className="cs-container cs-faq-container">
          <div className="cs-section-head">
            <span className="cs-kicker">CÂU HỎI THƯỜNG GẶP</span>
            <h2>Giải đáp nhanh về CineScope</h2>
          </div>

          <div className="cs-faq-list">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={item.q}
                  className={isOpen ? 'cs-faq-item open' : 'cs-faq-item'}
                >
                  <button
                    type="button"
                    className="cs-faq-btn"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="cs-faq-symbol">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && <p className="cs-faq-ans">{item.a}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Nút điều hướng 3 (Điểm chốt cuối trang) */}
      <section className="cs-cta-section">
        <div className="cs-container">
          <div className="cs-cta-box">
            <h2>Sẵn sàng khám phá thư viện phim của CineScope?</h2>
            <p>
              Bước vào không gian điện ảnh và trò chuyện cùng trợ lý AI Cine ngay bây giờ.
            </p>
            <button
              type="button"
              className="cs-btn-primary cs-btn-lg"
              onClick={() => setEntered(true)}
            >
              Mở CineScope →
            </button>
          </div>
        </div>
      </section>

      {/* Footer & Thông tin liên hệ */}
      <footer className="cs-footer" id="contact">
        <div className="cs-container cs-footer-grid">
          <div className="cs-footer-about">
            <div className="cs-brand">
              <span className="cs-brand-badge">CS</span>
              <div className="cs-brand-text">
                <strong>CINESCOPE</strong>
                <span>YOUR MOVIE UNIVERSE</span>
              </div>
            </div>
            <p>
              Nền tảng khám phá phim trực tuyến tối giản, hiện đại và tích hợp trợ lý
              trí tuệ nhân tạo Gemini.
            </p>
          </div>

          <div className="cs-footer-col">
            <h4>Danh mục</h4>
            <a href="#top">Trang đầu</a>
            <a href="#ai-cine">Trợ lý AI Cine</a>
            <a href="#features">Tính năng</a>
            <a href="#faq">Hỏi đáp</a>
          </div>

          <div className="cs-footer-col">
            <h4>Liên hệ</h4>
            <a href="mailto:hnam.nt1612@gmail.com">
              Email: hnam.nt1612@gmail.com
            </a>
            <a href="tel:0973008720">
              SĐT / Zalo: 0973 008 720
            </a>
          </div>
        </div>

        <div className="cs-container cs-footer-bottom">
          <span>© {new Date().getFullYear()} CineScope · Nguyễn Trọng Hải Nam</span>
          <span>hnam.nt1612@gmail.com · 0973 008 720</span>
        </div>
        
      </footer>
      
      {/* Bong bóng liên hệ hỗ trợ qua Facebook */}
      <a
        href={"https://www.facebook.com/namofrose"}
        target="_blank"
        rel="noopener noreferrer"
        className="cs-support-bubble"
        aria-label="Liên hệ qua Facebook"
      >
        <span className="cs-support-tooltip">Liên hệ qua Facebook</span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      </a>
    </div>
  )
}
