import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = "src/data";
const OUTPUT = path.join(OUTPUT_DIR, "movies.json");
const API = "https://datasets-server.huggingface.co/rows?dataset=lavinal712%2Ftmdb-poster&config=movie&split=train";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Hàm dịch tiếng Anh sang tiếng Việt sử dụng Google Translate API ngầm miễn phí
async function translateToVietnamese(text) {
  if (!text || text.trim() === "") return "Đang cập nhật nội dung mô tả cho bộ phim này.";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const json = await res.json();
    // Ghép các đoạn dịch lại với nhau
    return json[0].map((item) => item[0]).join("");
  } catch (err) {
    return text; // Nếu lỗi mạng thì giữ nguyên bản gốc
  }
}

async function main() {
  console.log("🚀 Bắt đầu tải và tự động dịch 4.000 bộ phim sang Tiếng Việt...");
  
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (err) {}

  const allMovies = [];
  const pageSize = 50; // Giảm kích thước mỗi trang xuống 50 để quá trình dịch ổn định, không nghẽn mạng
  const TARGET_COUNT = 4000;

  for (let offset = 0; offset < TARGET_COUNT; offset += pageSize) {
    const url = `${API}&offset=${offset}&length=${pageSize}`;
    let response;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(url);
        if (response.ok) break;
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (attempt === 3) throw error;
        console.log(`⚠️ Thử lại offset ${offset} (Lần ${attempt}/3)...`);
        await wait(4000 * attempt);
      }
    }

    const data = await response.json();
    const rows = data.rows ?? [];
    if (rows.length === 0) {
      console.log("ℹ️ Đã quét hết dữ liệu trên server.");
      break;
    }

    for (const entry of rows) {
      const row = entry.row;
      if (!row || !row.id) continue;

      // Dịch phần overview sang tiếng Việt
      const viOverview = await translateToVietnamese(row.overview);

      allMovies.push({
        id: row.id,
        title: row.title || row.original_title || "Chưa có tên",
        releaseDate: row.release_date || "2023-01-01",
        genres: row.genres ? row.genres.split(",").map(g => g.trim()) : ["Điện ảnh"],
        rating: row.vote_average ?? 7.0,
        popularity: row.popularity ?? 100,
        overview: viOverview,
        posterPath: row.poster_path || null,
        backdropPath: row.backdrop_path || null,
        runtime: row.runtime ?? 120,
        directors: [],
        cast: []
      });

      // Tạm dừng cực ngắn giữa các phim để không bị Google chặn IP dịch
      await wait(100);
    }

    console.log(`📥 Đã tải và dịch xong ${allMovies.length}/${TARGET_COUNT} bộ phim...`);

    if (allMovies.length >= TARGET_COUNT) break;
    await wait(1500);
  }

  await fs.writeFile(OUTPUT, JSON.stringify(allMovies, null, 2), "utf8");
  console.log(`\n✨ HOÀN TẤT! Đã tạo file ${OUTPUT} với toàn bộ mô tả bằng Tiếng Việt.`);
}

main().catch((error) => {
  console.error("❌ Lỗi trong quá trình chạy:", error.message);
  process.exitCode = 1;
});