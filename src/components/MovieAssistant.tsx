import { useState, type FormEvent } from 'react'
import './MovieAssistant.css'

type MovieAssistantProps = {
  onSubmit: (prompt: string) => void
  isLoading?: boolean
  error?: string
}

const suggestions = [
  'Tôi muốn phim trinh thám có cú twist',
  'Tìm phim hài để xem cuối tuần',
  'Phim khoa học viễn tưởng được đánh giá cao',
]

export default function MovieAssistant({
  onSubmit,
  isLoading = false,
  error = '',
}: MovieAssistantProps) {
  const [prompt, setPrompt] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isLoading) return
    onSubmit(trimmedPrompt)
  }

  function useSuggestion(suggestion: string) {
    setPrompt(suggestion)
  }

  return (
    <section className="movie-assistant" aria-labelledby="movie-assistant-title">
      <div className="movie-assistant__heading">
        <span className="movie-assistant__eyebrow">CINESCOPE AI</span>
        <h2 id="movie-assistant-title">Anh muốn xem phim như thế nào?</h2>
        <p>Mô tả tâm trạng hoặc kiểu phim anh đang tìm. CineScope sẽ giúp thu hẹp lựa chọn.</p>
      </div>

      <form className="movie-assistant__form" onSubmit={handleSubmit}>
        <label className="movie-assistant__label" htmlFor="movie-assistant-prompt">
          Mô tả bộ phim anh muốn tìm
        </label>
        <textarea
          id="movie-assistant-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ví dụ: Phim trinh thám ít bạo lực, có cú twist, dài dưới 120 phút..."
          rows={3}
          maxLength={500}
          disabled={isLoading}
        />
        <div className="movie-assistant__form-footer">
          <span>{prompt.length}/500 ký tự</span>
          <button type="submit" disabled={!prompt.trim() || isLoading}>
            {isLoading ? 'Đang tìm...' : 'Tìm phim phù hợp'}
            {!isLoading && <span aria-hidden="true"> ↗</span>}
          </button>
        </div>
      </form>

      <div className="movie-assistant__suggestions" aria-label="Gợi ý câu tìm kiếm">
        <span>Thử hỏi:</span>
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => useSuggestion(suggestion)}
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error && <p className="movie-assistant__error" role="alert">{error}</p>}
      <p className="movie-assistant__note">
        Kết quả sẽ được chọn từ thư viện phim hiện có, không tạo ra tên phim giả.
      </p>
    </section>
  )
}
