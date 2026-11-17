import fs from "node:fs/promises";
import path from "node:path";

const TMDB_API_KEY = "1f1e2393ec73a1fb409804cefc95808c";
const OUTPUT_DIR = "src/data";
const OUTPUT = path.join(OUTPUT_DIR, "movies.json");
const PER_COUNTRY_COUNT = 100;
const BATCH_SIZE = 5;

const COUNTRIES = [
  { code: "JP", lang: "ja", name: "Nhật Bản", minVotes: 10 },
  { code: "CN", lang: "zh", name: "Trung Quốc", minVotes: 5 },
  { code: "TH", lang: "th", name: "Thái Lan", minVotes: 3 },
  { code: "VN", lang: "vi", name: "Việt Nam", minVotes: 0 },
  { code: "IN", lang: "hi", name: "Ấn Độ", minVotes: 10 },
  { code: "FR", lang: "fr", name: "Pháp", minVotes: 15 },
  { code: "ES", lang: "es", name: "Tây Ban Nha", minVotes: 15 },
  { code: "GB", lang: "en", name: "Anh", minVotes: 20 },
];

const TMDB_GENRE_MAP = {
  28: "Hành động",
  12: "Phiêu lưu",
  16: "Hoạt hình",
  35: "Hài",
  80: "Hình sự",
  99: "Tài liệu",
  18: "Chính kịch",
  10751: "Gia đình",
  14: "Giả tưởng",
  36: "Lịch sử",
  27: "Kinh dị",
  10402: "Âm nhạc",
  9648: "Bí ẩn",
  10749: "Lãng mạn",
  878: "Khoa học viễn tưởng",
  10770: "Phim truyền hình",
  53: "Gây cấn",
  10752: "Chiến tranh",
  37: "Miền Tây",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateToVietnamese(text, sourceLang = "en") {
  if (!text || text.trim() === "") {
    return "Đang cập nhật nội dung mô tả cho bộ phim này.";
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    return json[0].map((item) => item[0]).join("");
  } catch {
    return text;
  }
}

async function fetchJson(url) {
  const token = TMDB_API_KEY.trim();
  const targetUrl = new URL(url);
  const headers = { Accept: "application/json" };

  if (token.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    targetUrl.searchParams.set("api_key", token);
  }

  const res = await fetch(targetUrl.toString(), { headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      `TMDB HTTP ${res.status}: ${errBody.status_message || "Lỗi kết nối TMDB"}`
    );
  }
  return res.json();
}

async function collectIdsForCountry(country, globalSeenIds) {
  const today = new Date().toISOString().slice(0, 10);
  const collected = [];

  for (let page = 1; page <= 25 && collected.length < PER_COUNTRY_COUNT; page++) {
    const url = new URL("https://api.themoviedb.org/3/discover/movie");
    url.searchParams.set("language", "vi-VN");
    url.searchParams.set("with_origin_country", country.code);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("primary_release_date.lte", today);
    if (country.minVotes > 0) {
      url.searchParams.set("vote_count.gte", String(country.minVotes));
    }
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("page", String(page));

    const data = await fetchJson(url.toString());
    const results = data.results ?? [];
    if (results.length === 0) break;

    for (const item of results) {
      if (collected.length >= PER_COUNTRY_COUNT) break;
      if (!item.id || globalSeenIds.has(item.id) || !item.poster_path) continue;
      globalSeenIds.add(item.id);
      collected.push(item.id);
    }
    await wait(80);
  }

  return collected;
}

async function fetchMovieDetail(id, country) {
  const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
  url.searchParams.set("language", "vi-VN");
  url.searchParams.set("append_to_response", "credits,translations");

  const data = await fetchJson(url.toString());

  let overview = (data.overview || "").trim();
  if (!overview) {
    const enOverview = data.translations?.translations?.find(
      (t) => t.iso_639_1 === "en"
    )?.data?.overview;
    const nativeOverview = data.translations?.translations?.find(
      (t) => t.iso_639_1 === country.lang
    )?.data?.overview;

    if (enOverview?.trim()) {
      overview = await translateToVietnamese(enOverview.trim(), "en");
    } else if (nativeOverview?.trim()) {
      overview = await translateToVietnamese(nativeOverview.trim(), country.lang);
    } else {
      overview = "Đang cập nhật nội dung mô tả cho bộ phim này.";
    }
  }

  const genres =
    Array.isArray(data.genres) && data.genres.length > 0
      ? data.genres.map(
          (g) => TMDB_GENRE_MAP[g.id] || g.name.replace(/^Phim\s+/i, "")
        )
      : ["Điện ảnh"];

  const directors = Array.isArray(data.credits?.crew)
    ? data.credits.crew
        .filter((person) => person.job === "Director")
        .map((person) => person.name)
    : [];

  const cast = Array.isArray(data.credits?.cast)
    ? data.credits.cast.slice(0, 6).map((person) => person.name)
    : [];

  return {
    id: data.id,
    title: data.title || data.original_title || "Chưa có tên",
    releaseDate: data.release_date || "2024-01-01",
    country: country.name,
    genres,
    rating: Number(data.vote_average ?? 7.0),
    popularity: Number(data.popularity ?? 50),
    overview,
    posterPath: data.poster_path || null,
    backdropPath: data.backdrop_path || null,
    runtime: Number(data.runtime ?? 110),
    directors,
    cast,
  };
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let existingMovies = [];
  try {
    const raw = await fs.readFile(OUTPUT, "utf8");
    existingMovies = JSON.parse(raw);
  } catch {
    existingMovies = [];
  }

  const globalSeenIds = new Set(existingMovies.map((m) => m.id));
  console.log(`📚 Kho hiện tại có ${existingMovies.length} bộ phim.`);

  const allNewMovies = [];

  for (const country of COUNTRIES) {
    console.log(`\n🌍 Đang tìm ${PER_COUNTRY_COUNT} phim [${country.name}]...`);
    const ids = await collectIdsForCountry(country, globalSeenIds);
    console.log(`🎬 Tìm thấy ${ids.length} phim ${country.name}. Đang tải chi tiết...`);

    const countryMovies = [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      const details = await Promise.all(
        batch.map((id) => fetchMovieDetail(id, country))
      );
      countryMovies.push(...details);
      await wait(120);
    }

    allNewMovies.push(...countryMovies);
    console.log(`✅ Xong ${country.name}: +${countryMovies.length} phim.`);
  }

  const merged = [...existingMovies, ...allNewMovies];
  await fs.writeFile(OUTPUT, JSON.stringify(merged, null, 2), "utf8");
  console.log(
    `\n✨ HOÀN TẤT! Đã thêm tổng cộng ${allNewMovies.length} phim từ ${COUNTRIES.length} quốc gia. Tổng kho hiện tại: ${merged.length} phim.`
  );
}

main().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exitCode = 1;
});