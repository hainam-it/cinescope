import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = "src/data";
const OUTPUT = path.join(OUTPUT_DIR, "movies.json");
const DATASET_BASE =
  "https://datasets-server.huggingface.co";
const DATASET_PARAMS =
  "dataset=lavinal712%2Ftmdb-poster&config=movie&split=train";

const TARGET_NEW_KOREAN = 200; // Số phim Hàn mới cần thêm
const MAX_SCAN_ROWS = 20000; // Giới hạn quét tối đa nếu dùng chế độ quét tuần tự
const PAGE_SIZE = 100;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Ánh xạ thể loại TMDB sang tiếng Việt để khớp với bộ lọc hiện tại trên web
const GENRE_VI_MAP = {
  Action: "Hành động",
  Adventure: "Phiêu lưu",
  Animation: "Hoạt hình",
  Comedy: "Hài",
  Crime: "Hình sự",
  Documentary: "Tài liệu",
  Drama: "Chính kịch",
  Family: "Gia đình",
  Fantasy: "Giả tưởng",
  History: "Lịch sử",
  Horror: "Kinh dị",
  Music: "Âm nhạc",
  Mystery: "Bí ẩn",
  Romance: "Lãng mạn",
  "Science Fiction": "Khoa học viễn tưởng",
  "TV Movie": "Phim truyền hình",
  Thriller: "Gây cấn",
  War: "Chiến tranh",
  Western: "Miền Tây",
};

function mapGenresToVietnamese(rawGenres) {
  if (!rawGenres) return ["Điện ảnh"];
  return rawGenres
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => GENRE_VI_MAP[g] || g);
}

// Hàm dịch tiếng Anh sang tiếng Việt giống script gốc của bạn
async function translateToVietnamese(text) {
  if (!text || text.trim() === "") {
    return "Đang cập nhật nội dung mô tả cho bộ phim này.";
  }
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    return json[0].map((item) => item[0]).join("");
  } catch {
    return text;
  }
}

async function fetchWithRetry(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 3) throw error;
      console.log(`⚠️ Thử lại (Lần ${attempt}/3)...`);
      await wait(3000 * attempt);
    }
  }
}

// Thu thập danh sách phim Hàn (original_language === "ko") chưa có trong kho
async function collectKoreanRows(existingIds) {
  const candidates = new Map();

  // Cách 1: Dùng endpoint /filter của Hugging Face để lọc thẳng phim Hàn
  try {
    for (let offset = 0; offset < 1500; offset += PAGE_SIZE) {
      const filterUrl = `${DATASET_BASE}/filter?${DATASET_PARAMS}&where=original_language%3D%27ko%27&offset=${offset}&length=${PAGE_SIZE}`;
      const data = await fetchWithRetry(filterUrl);
      const rows = data?.rows ?? [];
      if (rows.length === 0) break;

      for (const entry of rows) {
        const row = entry.row;
        if (!row?.id || existingIds.has(row.id) || !row.poster_path) continue;
        candidates.set(row.id, row);
      }

      if (rows.length < PAGE_SIZE) break;
      await wait(300);
    }

    if (candidates.size > 0) {
      return [...candidates.values()];
    }
  } catch {
    console.log("ℹ️ Chuyển sang chế độ quét tuần tự qua /rows...");
  }

  // Cách 2: Quét tuần tự qua /rows giống script cũ nếu /filter không khả dụng
  for (let offset = 0; offset < MAX_SCAN_ROWS; offset += PAGE_SIZE) {
    const rowsUrl = `${DATASET_BASE}/rows?${DATASET_PARAMS}&offset=${offset}&length=${PAGE_SIZE}`;
    const data = await fetchWithRetry(rowsUrl);
    const rows = data?.rows ?? [];
    if (rows.length === 0) break;

    for (const entry of rows) {
      const row = entry.row;
      if (
        !row?.id ||
        row.original_language !== "ko" ||
        existingIds.has(row.id) ||
        !row.poster_path
      ) {
        continue;
      }
      candidates.set(row.id, row);
    }

    if (offset % 1000 === 0 && offset > 0) {
      console.log(
        `🔎 Đã quét ${offset} dòng, gom được ${candidates.size} phim Hàn...`
      );
    }
    await wait(250);
  }

  return [...candidates.values()];
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 1. Đọc kho phim hiện tại để giữ nguyên 400 phim cũ và tránh trùng ID
  let existingMovies = [];
  try {
    const currentRaw = await fs.readFile(OUTPUT, "utf8");
    existingMovies = JSON.parse(currentRaw);
  } catch {
    existingMovies = [];
  }

  const existingIds = new Set(existingMovies.map((m) => m.id));
  console.log(`📚 Kho hiện tại đang có ${existingMovies.length} bộ phim.`);
  console.log("🔍 Đang tìm các bộ phim Hàn Quốc mới nhất từ Hugging Face...");

  // 2. Lấy toàn bộ phim Hàn chưa có trong kho và sắp xếp theo ngày phát hành mới nhất
  const koreanCandidates = await collectKoreanRows(existingIds);
  koreanCandidates.sort((a, b) =>
    (b.release_date || "").localeCompare(a.release_date || "")
  );

  const selectedRows = koreanCandidates.slice(0, TARGET_NEW_KOREAN);
  console.log(
    `🎬 Đã chọn ${selectedRows.length} phim Hàn mới nhất. Bắt đầu dịch mô tả sang Tiếng Việt...`
  );

  // 3. Dịch mô tả và chuẩn hóa dữ liệu đúng cấu trúc movies.json
  const newKoreanMovies = [];
  for (let i = 0; i < selectedRows.length; i++) {
    const row = selectedRows[i];
    const viOverview = await translateToVietnamese(row.overview);

    newKoreanMovies.push({
      id: row.id,
      title: row.title || row.original_title || "Chưa có tên",
      releaseDate: row.release_date || "2024-01-01",
      genres: mapGenresToVietnamese(row.genres),
      rating: row.vote_average ?? 7.0,
      popularity: row.popularity ?? 100,
      overview: viOverview,
      posterPath: row.poster_path || null,
      backdropPath: row.backdrop_path || null,
      runtime: row.runtime ?? 120,
      directors: [],
      cast: [],
    });

    if ((i + 1) % 25 === 0 || i === selectedRows.length - 1) {
      console.log(`📥 Đã dịch xong ${i + 1}/${selectedRows.length} phim Hàn...`);
    }
    await wait(100);
  }

  // 4. Gộp phim cũ + 200 phim Hàn mới và ghi đè lại file movies.json
  const mergedMovies = [...existingMovies, ...newKoreanMovies];
  await fs.writeFile(OUTPUT, JSON.stringify(mergedMovies, null, 2), "utf8");

  console.log(
    `\n✨ HOÀN TẤT! Đã thêm ${newKoreanMovies.length} phim Hàn mới. Tổng kho hiện tại: ${mergedMovies.length} bộ phim.`
  );
}

main().catch((error) => {
  console.error("❌ Lỗi trong quá trình chạy:", error.message);
  process.exitCode = 1;
});