const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const INSTANCE = '7107651396';
const TOKEN = '85ded0f8b7de4d088928bf9c54b1a9002db2018c2132493ebb';
const BASE = `https://7107.api.green-api.com/waInstance${INSTANCE}`;

const GEMINI_KEY = process.env.GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// İşletmenin bilgisi - kendi işine göre düzenle
const SYSTEM_PROMPT = `Sen bir işletmenin WhatsApp müşteri hizmetleri asistanısın.
Görevin müşterilere kibarca, kısa ve net cevap vermek.
Rezervasyon, fiyat, çalışma saatleri gibi sorulara yardımcı ol.
Türkçe konuş, samimi ama profesyonel ol. Cevapların kısa olsun (en fazla 3-4 cümle).
Emoji kullanabilirsin ama az.`;

// Her müşteri için konuşma geçmişi (basit bellek)
const conversations = {};

app.get('/', (req, res) => res.send('WhatsApp Gemini Bot çalışıyor! 🤖'));

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (!body || body.typeWebhook !== 'incomingMessageReceived') return;
    const text = body.messageData?.textMessageData?.textMessage || body.messageData?.extendedTextMessageData?.text;
    const phone = body.senderData?.sender;
    if (!text || !phone) return;

    // Konuşma geçmişini al
    if (!conversations[phone]) conversations[phone] = [];
    conversations[phone].push({ role: 'user', parts: [{ text }] });

    // Gemini'ye gönder
    const reply = await askGemini(conversations[phone]);

    conversations[phone].push({ role: 'model', parts: [{ text: reply }] });
    // Geçmişi son 10 mesajla sınırla
    if (conversations[phone].length > 10) conversations[phone] = conversations[phone].slice(-10);

    await axios.post(`${BASE}/sendMessage/${TOKEN}`, {
      chatId: phone,
      message: reply
    });
    console.log(`Gemini yanıtı → ${phone}: ${reply.substring(0, 50)}`);
  } catch (e) {
    console.error('Hata:', e.message);
  }
});

async function askGemini(history) {
  try {
    const response = await axios.post(GEMINI_URL, {
      contents: history,
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    }, { headers: { 'Content-Type': 'application/json' } });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || 'Üzgünüm, şu an cevap veremiyorum. Lütfen daha sonra tekrar deneyin.';
  } catch (e) {
    console.error('Gemini hatası:', e.response?.data || e.message);
    return 'Merhaba! Size yardımcı olmaya çalışıyorum ama şu an küçük bir teknik sorun var. Birazdan tekrar yazar mısınız? 🙏';
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gemini Bot ${PORT} portunda çalışıyor`));