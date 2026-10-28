export type MovieSearchRecord = {
  id: number
  title: string
  year: string
  genres: string[]
  overview: string
  rating: number
  popularity: number
  runtime: number
  directors: string[]
  cast: string[]
}

export type MovieSearchOptions = {
  query?: string
  genre?: string
  maxRuntime?: number
  minRating?: number
  limit?: number
}

/**
 * Normalize Vietnamese text so queries work with or without diacritics.
 * Example: "trinh tham" matches "trinh thám".
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function searchMovies(
  movies: MovieSearchRecord[],
  options: MovieSearchOptions = {},
): MovieSearchRecord[] {
  const query = normalizeSearchText(options.query ?? '')
  const genre = normalizeSearchText(options.genre ?? '')
  const maxRuntime = options.maxRuntime
  const minRating = options.minRating
  const limit = options.limit ?? 24

  return movies
    .map((movie) => {
      const searchableFields = [
        movie.title,
        movie.overview,
        movie.year,
        ...movie.genres,
        ...movie.directors,
        ...movie.cast,
      ]
      const normalizedFields = searchableFields.map(normalizeSearchText)
      const matchesQuery =
        !query ||
        normalizedFields.some((field) => field.includes(query)) ||
        query.split(' ').every((word) =>
          normalizedFields.some((field) => field.includes(word)),
        )
      const matchesGenre =
        !genre ||
        movie.genres.some((item) =>
          normalizeSearchText(item).includes(genre),
        )
      const matchesRuntime =
        maxRuntime == null || maxRuntime <= 0 || (movie.runtime > 0 && movie.runtime <= maxRuntime)
      const matchesRating =
        minRating == null || movie.rating >= minRating

      if (!matchesQuery || !matchesGenre || !matchesRuntime || !matchesRating) {
        return null
      }

      const title = normalizeSearchText(movie.title)
      const genreMatch = genre && movie.genres.some((item) =>
        normalizeSearchText(item).includes(genre),
      )
      const score =
        (query && title === query ? 100 : 0) +
        (query && title.startsWith(query) ? 35 : 0) +
        (query && title.includes(query) ? 20 : 0) +
        (genreMatch ? 10 : 0) +
        Math.min(Math.max(movie.rating, 0), 10) +
        Math.log1p(Math.max(movie.popularity, 0)) / 10

      return { movie, score }
    })
    .filter((item): item is { movie: MovieSearchRecord; score: number } => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit))
    .map(({ movie }) => movie)
}
