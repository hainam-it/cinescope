import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CSSProperties } from 'react'
import './CineScopeBot.css'

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

type HistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AssistantResponse = {
  reply: string
  movies: Movie[]
}

type CineScopeBotProps = {
  onSubmit: (
    prompt: string,
    history: HistoryMessage[],
  ) => Promise<AssistantResponse>
  onSelectMovie?: (movie: Movie) => void
}

type ChatMessage = {
  id: number
  role: 'bot' | 'user'
  text: string
}

const suggestions = [
  'Gợi ý phim hành động hay',
  'Phim có điểm đánh giá cao',
  'Phim khoa học viễn tưởng',
  'Tôi đang buồn, gợi ý phim nhẹ nhàng nhé',
]

const EDGE_MARGIN = 20
const DEFAULT_LAUNCHER_SIZE = 58

export default function CineScopeBot({
  onSubmit,
  onSelectMovie,
}: CineScopeBotProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Movie[] | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: 'Xin chào bạn! 🍿 Tôi là Cine, trợ lý phim nhỏ của bạn. Hôm nay bạn thế nào? Mình có thể trò chuyện hoặc cùng tìm một bộ phim thật hợp tâm trạng nhé.',
    },
  ])

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  const [side, setSide] = useState<'left' | 'right'>('right')
  const [position, setPosition] = useState(() => ({
    x:
      typeof window !== 'undefined'
        ? Math.max(EDGE_MARGIN, window.innerWidth - DEFAULT_LAUNCHER_SIZE - EDGE_MARGIN)
        : 1200,
    y: EDGE_MARGIN,
  }))
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)

  const launcherRef = useRef<HTMLButtonElement>(null)
  const dragStart = useRef({
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
  })
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(2)

  const getLauncherSize = () =>
    launcherRef.current?.offsetWidth || DEFAULT_LAUNCHER_SIZE

  useEffect(() => {
    if (!chatBodyRef.current) return
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
  }, [messages, results, isLoading, error, isOpen])

  // Giữ nút AI luôn bám đúng cạnh màn hình khi thay đổi kích thước cửa sổ
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const size = getLauncherSize()
      const maxX = Math.max(EDGE_MARGIN, width - size - EDGE_MARGIN)
      const maxY = Math.max(EDGE_MARGIN, height - size - EDGE_MARGIN)

      setViewport({ width, height })
      setPosition((current) => ({
        x: side === 'left' ? EDGE_MARGIN : maxX,
        y: Math.min(maxY, Math.max(EDGE_MARGIN, current.y)),
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [side])

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
    }
    setIsDragging(true)
    setHasMoved(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return
    const deltaX = event.clientX - dragStart.current.pointerX
    const deltaY = event.clientY - dragStart.current.pointerY

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      setHasMoved(true)
    }

    const size = getLauncherSize()
    const maxX = Math.max(EDGE_MARGIN, viewport.width - size - EDGE_MARGIN)
    const maxY = Math.max(EDGE_MARGIN, viewport.height - size - EDGE_MARGIN)

    const nextX = Math.min(
      maxX,
      Math.max(EDGE_MARGIN, dragStart.current.startX + deltaX),
    )
    const nextY = Math.min(
      maxY,
      Math.max(EDGE_MARGIN, dragStart.current.startY - deltaY),
    )

    setPosition({ x: nextX, y: nextY })
    setSide(nextX + size / 2 < viewport.width / 2 ? 'left' : 'right')
  }

  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    const size = getLauncherSize()
    const maxX = Math.max(EDGE_MARGIN, viewport.width - size - EDGE_MARGIN)
    const maxY = Math.max(EDGE_MARGIN, viewport.height - size - EDGE_MARGIN)

    setPosition((current) => {
      const snapToLeft = current.x + size / 2 < viewport.width / 2
      setSide(snapToLeft ? 'left' : 'right')
      return {
        x: snapToLeft ? EDGE_MARGIN : maxX,
        y: Math.min(maxY, Math.max(EDGE_MARGIN, current.y)),
      }
    })
  }

  const handleLauncherClick = () => {
    if (hasMoved) {
      setHasMoved(false)
      return
    }
    setIsOpen((current) => !current)
    setShowWelcome(false)
  }

  const sendMessage = async (text: string) => {
    const prompt = text.trim()
    if (!prompt || isLoading) return

    const priorHistory: HistoryMessage[] = messages
      .filter((message) => message.role === 'user' || message.role === 'bot')
      .slice(-10)
      .map((message) => ({
        role: message.role === 'bot' ? 'assistant' : 'user',
        content: message.text,
      }))

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: 'user',
      text: prompt,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setShowWelcome(false)
    setIsLoading(true)
    setError('')
    setResults(null)

    try {
      const response = await onSubmit(prompt, priorHistory)
      setMessages((current) => [
        ...current,
        {
          id: nextMessageId.current++,
          role: 'bot',
          text: response.reply,
        },
      ])
      setResults(response.movies)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Cine đang gặp chút trục trặc. Anh thử lại nhé.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    void sendMessage(suggestion)
  }

  const launcherSize = getLauncherSize()
  const snapTransition = isDragging
    ? 'none'
    : 'left 0.28s cubic-bezier(0.22, 1, 0.36, 1), right 0.28s cubic-bezier(0.22, 1, 0.36, 1), bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1), top 0.28s cubic-bezier(0.22, 1, 0.36, 1)'

  const launcherStyle: CSSProperties = {
    left: `${position.x}px`,
    right: 'auto',
    bottom: `${position.y}px`,
    top: 'auto',
    touchAction: 'none',
    transition: snapTransition,
  }

  // Bong bóng lời chào chạy đồng bộ theo nút AI
  const placeBubbleBelow = position.y + launcherSize + 84 > viewport.height
  const welcomeBubbleStyle: CSSProperties = {
    ...(side === 'left'
      ? { left: `${Math.max(16, position.x)}px`, right: 'auto' }
      : {
          right: `${Math.max(16, viewport.width - (position.x + launcherSize))}px`,
          left: 'auto',
        }),
    ...(placeBubbleBelow
      ? { top: `${viewport.height - position.y + 12}px`, bottom: 'auto' }
      : { bottom: `${position.y + launcherSize + 12}px`, top: 'auto' }),
    transition: snapTransition,
  }

  // Khung chat chính chạy đồng bộ và không tràn khỏi màn hình
  const estimatedChatHeight = Math.min(540, viewport.height - 108)
  const spaceAbove = viewport.height - (position.y + launcherSize + 14)
  const spaceBelow = position.y - 14

  let verticalChatStyle: CSSProperties
  if (spaceAbove >= estimatedChatHeight || spaceAbove >= spaceBelow) {
    const clampedBottom = Math.min(
      position.y + launcherSize + 14,
      Math.max(16, viewport.height - estimatedChatHeight - 16),
    )
    verticalChatStyle = { bottom: `${clampedBottom}px`, top: 'auto' }
  } else {
    const clampedTop = Math.min(
      viewport.height - position.y + 14,
      Math.max(16, viewport.height - estimatedChatHeight - 16),
    )
    verticalChatStyle = { top: `${clampedTop}px`, bottom: 'auto' }
  }

  const chatWindowStyle: CSSProperties = {
    ...(side === 'left'
      ? {
          left: `${Math.max(16, Math.min(position.x, viewport.width - 340))}px`,
          right: 'auto',
        }
      : {
          right: `${Math.max(
            16,
            Math.min(
              viewport.width - (position.x + launcherSize),
              viewport.width - 340,
            ),
          )}px`,
          left: 'auto',
        }),
    ...verticalChatStyle,
    maxHeight: `${estimatedChatHeight}px`,
    transition: snapTransition,
  }

  return (
    <div className="cinescope-bot-root">
      {isOpen && (
        <section
          className="cine-chat-window"
          style={chatWindowStyle}
          aria-label="Trò chuyện với CineScope"
        >
          <header className="cine-chat-header">
            <div className="cine-bot-avatar">
              <span>🍿</span>
              <i className="cine-online-dot" />
            </div>
            <div className="cine-chat-heading">
              <strong>Cine</strong>
              <span>Trợ lý phim của bạn</span>
            </div>
            <button
              className="cine-header-button"
              type="button"
              aria-label="Thu nhỏ khung chat"
              onClick={() => setIsOpen(false)}
            >
              −
            </button>
            <button
              className="cine-header-button"
              type="button"
              aria-label="Đóng lời chào"
              onClick={() => {
                setIsOpen(false)
                setShowWelcome(false)
              }}
            >
              ×
            </button>
          </header>

          <div className="cine-chat-intro">
            <span className="cine-intro-sparkle">✦</span>
            <div>
              <strong>Hôm nay mình xem gì nhỉ?</strong>
              <p>Kể tôi nghe tâm trạng hoặc thể loại bạn thích nhé.</p>
            </div>
          </div>

          <div className="cine-chat-messages" ref={chatBodyRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'cine-message-row user'
                    : 'cine-message-row bot'
                }
              >
                {message.role === 'bot' && (
                  <span className="cine-message-avatar">🍿</span>
                )}
                <div className="cine-message-bubble">{message.text}</div>
              </div>
            ))}

            {showWelcome && messages.length === 1 && (
              <div className="cine-suggestions">
                <span className="cine-suggestions-label">THỬ HỎI CINE</span>
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="cine-message-row bot">
                <span className="cine-message-avatar">🍿</span>
                <div className="cine-typing">
                  <span />
                  <span />
                  <span />
                  <small>Cine đang suy nghĩ...</small>
                </div>
              </div>
            )}

            {error && <div className="cine-error-message">{error}</div>}

            {!isLoading && results !== null && results.length > 0 && (
              <div className="cine-results">
                <div className="cine-results-heading">
                  <strong>🍿 Phim Cine gợi ý</strong>
                  <span>{results.length} phim</span>
                </div>
                {results.map((movie) => (
                  <button
                    className="cine-result-card"
                    type="button"
                    key={movie.id}
                    onClick={() => onSelectMovie?.(movie)}
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                    <span className="cine-result-info">
                      <strong>{movie.title}</strong>
                      <small>
                        {movie.year}
                        {movie.genres.length > 0
                          ? ` · ${movie.genres.slice(0, 2).join(', ')}`
                          : ''}
                      </small>
                      <span className="cine-result-rating">
                        ★ {movie.rating.toFixed(1)}
                      </span>
                    </span>
                    <span className="cine-result-arrow">↗</span>
                  </button>
                ))}
              </div>
            )}

            {!isLoading && results !== null && results.length === 0 && (
              <div className="cine-empty-results">
                Cine chưa tìm thấy phim đủ phù hợp trong danh mục hiện tại. Bạn thử mô tả thêm một chút nhé.
              </div>
            )}
          </div>

          <div className="cine-chat-footer">
            <form onSubmit={handleSubmit} className="cine-chat-form">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Tâm sự hoặc hỏi Cine tìm phim..."
                aria-label="Nhắn tin với Cine"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Gửi tin nhắn"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 2 15 22l-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
            <p className="cine-chat-disclaimer">
              CineScope · Cùng bạn tìm bộ phim tiếp theo
            </p>
          </div>
        </section>
      )}

      {!isOpen && showWelcome && (
        <div className="cine-welcome-bubble" style={welcomeBubbleStyle}>
          <button
            type="button"
            aria-label="Ẩn lời chào"
            onClick={() => setShowWelcome(false)}
          >
            ×
          </button>
          <strong>Chào bạn! 👋</strong>
          <span>Cần tìm phim hay không?</span>
        </div>
      )}

      <button
        ref={launcherRef}
        className={`cine-bot-launcher ${isDragging ? 'dragging' : ''}`}
        style={launcherStyle}
        type="button"
        aria-label={isOpen ? 'Thu nhỏ Cine' : 'Mở trò chuyện với Cine'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleLauncherClick}
      >
        <span className="cine-launcher-face">
          <span className="cine-face-eyes">
            <i />
            <i />
          </span>
          <span className="cine-face-blush">
            <i />
            <i />
          </span>
          <span className="cine-face-mouth" />
        </span>
        <span className="cine-launcher-popcorn">🍿</span>
        {!isOpen && <span className="cine-launcher-notification">1</span>}
      </button>
    </div>
  )
}