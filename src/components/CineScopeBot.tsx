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
      text: 'Xin chào anh! 🍿 Tôi là Cine, trợ lý phim nhỏ của anh. Hôm nay anh thế nào? Mình có thể trò chuyện hoặc cùng tìm một bộ phim thật hợp tâm trạng nhé.',
    },
  ])

  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)

  const dragStart = useRef({
    pointerX: 0,
    pointerY: 0,
    startX: 0,
    startY: 0,
  })

  const chatBodyRef = useRef<HTMLDivElement>(null)
  const nextMessageId = useRef(2)

  useEffect(() => {
    if (!chatBodyRef.current) return
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
  }, [messages, results, isLoading, error, isOpen])

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

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) setHasMoved(true)

    const maxX = Math.max(0, window.innerWidth - 76)
    const maxY = Math.max(0, window.innerHeight - 76)

    setPosition({
      x: Math.min(maxX, Math.max(0, dragStart.current.startX - deltaX)),
      y: Math.min(maxY, Math.max(0, dragStart.current.startY - deltaY)),
    })
  }

  const handlePointerUp = () => setIsDragging(false)

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

  const launcherStyle: CSSProperties = {
    right: `${20 + position.x}px`,
    bottom: `${20 + position.y}px`,
  }

  return (
    <div className="cinescope-bot-root">
      {isOpen && (
        <section className="cine-chat-window" aria-label="Trò chuyện với CineScope">
          <header className="cine-chat-header">
            <div className="cine-bot-avatar">
              <span>🍿</span>
              <i className="cine-online-dot" />
            </div>

            <div className="cine-chat-heading">
              <strong>Cine</strong>
              <span>Trợ lý phim của anh</span>
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
              <p>Kể tôi nghe tâm trạng hoặc thể loại anh thích nhé.</p>
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
                Cine chưa tìm thấy phim đủ phù hợp trong danh mục hiện tại. Anh thử mô tả thêm một chút nhé.
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
              CineScope · Cùng anh tìm bộ phim tiếp theo
            </p>
          </div>
        </section>
      )}

      {!isOpen && showWelcome && (
        <div className="cine-welcome-bubble">
          <button
            type="button"
            aria-label="Ẩn lời chào"
            onClick={() => setShowWelcome(false)}
          >
            ×
          </button>
          <strong>Chào anh! 👋</strong>
          <span>Cần tìm phim hay không?</span>
        </div>
      )}

      <button
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
