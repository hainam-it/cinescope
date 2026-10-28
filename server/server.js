
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "2mb" }));

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({ apiKey })
  : null;

const MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

// Kiểm tra backend có hoạt động hay không.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "CineScope API",
    provider: "Google Gemini",
  });
});

// Chat với Cine và đề xuất phim trong danh mục CineScope.
app.post("/api/chat", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "Thiếu GEMINI_API_KEY trong file server/.env",
      });
    }

    const { messages, movies } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Tin nhắn không hợp lệ.",
      });
    }

    if (!Array.isArray(movies)) {
      return res.status(400).json({
        error: "Danh sách phim không hợp lệ.",
      });
    }

    const validMessages = messages
      .filter(
        (message) =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .slice(-12)
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 4000),
      }));

    if (
      validMessages.length === 0 ||
      validMessages[validMessages.length - 1].role !== "user"
    ) {
      return res.status(400).json({
        error: "Tin nhắn cuối cùng phải đến từ người dùng.",
      });
    }

    // Chỉ đưa những trường cần thiết vào ngữ cảnh AI.
    const catalog = movies.slice(0, 100).map((movie) => ({
      id: String(movie.id),
      title: String(movie.title ?? ""),
      year: movie.year ?? null,
      genres: movie.genres ?? [],
      rating: movie.rating ?? null,
      runtime: movie.runtime ?? null,
      overview: String(movie.overview ?? "").slice(0, 1000),
    }));

    const systemInstruction = `
Bạn là Cine, trợ lý phim ảnh thân thiện, dễ thương của CineScope.
Bạn đang trò chuyện bằng tiếng Việt với người dùng.

QUY TẮC:
1. Trò chuyện tự nhiên, ấm áp, giống một người bạn.
2. Đọc lịch sử hội thoại để hiểu ngữ cảnh và câu hỏi tiếp nối.
3. Trả lời câu hỏi về phim dựa trên danh mục được cung cấp.
4. Chỉ đề xuất phim có ID tồn tại trong danh mục.
5. Nếu người dùng yêu cầu tìm hoặc gợi ý phim, chọn tối đa 6 phim phù hợp.
6. Nếu người dùng chỉ chào hỏi hoặc tâm sự, hãy trò chuyện tự nhiên;
   không cần ép buộc phải đề xuất phim.
7. Không bịa nội dung, điểm đánh giá hoặc thông tin phim.
8. Nếu không đủ thông tin để trả lời, hãy nói rõ và hỏi lại nhẹ nhàng.
9. Trường reply phải chứa câu trả lời dành cho người dùng.
10. Trường movieIds chỉ chứa ID phim thực sự muốn hiển thị.
11. Luôn trả kết quả đúng cấu trúc JSON được yêu cầu.
`;

    const prompt = `
LỊCH SỬ HỘI THOẠI:
${JSON.stringify(validMessages)}

DANH MỤC PHIM CỦA CINESCOPE:
${JSON.stringify(catalog)}

Hãy trả lời tin nhắn cuối cùng dựa trên lịch sử và danh mục phim.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
            },
            movieIds: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["reply", "movieIds"],
        },
      },
    });

    const rawText = response.text;

    if (!rawText) {
      throw new Error("Gemini không trả về nội dung.");
    }

    const result = JSON.parse(rawText);

    if (typeof result.reply !== "string") {
      throw new Error("Phản hồi Gemini không đúng định dạng.");
    }

    // Chỉ trả về ID thực sự có trong danh mục phim.
    const movieById = new Map(
      catalog.map((movie) => [movie.id, movie])
    );

    const movieIds = [
      ...new Set(
        (Array.isArray(result.movieIds) ? result.movieIds : [])
          .map(String)
          .filter((id) => movieById.has(id))
      ),
    ]
      .slice(0, 6)
      .map((id) => {
        const originalMovie = movies.find(
          (movie) => String(movie.id) === id
        );

        return originalMovie?.id;
      })
      .filter((id) => id !== undefined);

    return res.json({
      reply: result.reply,
      movieIds,
    });
  } catch (error) {
    console.error("Lỗi Gemini API:", error);

    return res.status(500).json({
      error:
        "Cine chưa thể kết nối AI. Hãy kiểm tra terminal backend.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`CineScope API đang chạy tại http://localhost:${PORT}`);
  console.log(`AI provider: Google Gemini`);
  console.log(`Model: ${MODEL}`);
});
