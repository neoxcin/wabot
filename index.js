const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const INSTANCE = '7107651396';
const TOKEN = '85ded0f8b7de4d088928bf9c54b1a9002db2018c2132493ebb';
const BASE = `https://7107.api.green-api.com/waInstance${INSTANCE}`;

const rules = [
  { kw: 'rezervasyon', resp: 'Rezervasyon için lütfen tarih ve saat yazınız 📅' },
  { kw: 'fiyat', resp: 'Fiyat listemiz için web sitemizi ziyaret edebilirsiniz 💰' },
  { kw: 'iptal', resp: 'İptal işlemi için lütfen randevu tarihinizi belirtin.' },
];
const DEFAULT_MSG = 'Merhaba! Size nasıl yardımcı olabilirim? 😊\n\n• Rezervasyon → rezervasyon yazın\n• Fiyat → fiyat yazın\n• İptal → iptal yazın';

app.get('/', (req, res) => res.send('WhatsApp Bot çalışıyor! 🤖'));

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body;
    if (!body || body.typeWebhook !== 'incomingMessageReceived') return;
    const text = body.messageData?.textMessageData?.textMessage || body.messageData?.extendedTextMessageData?.text;
    const phone = body.senderData?.sender;
    if (!text || !phone) return;
    const lower = text.toLowerCase();
    const rule = rules.find(r => lower.includes(r.kw));
    const reply = rule ? rule.resp : DEFAULT_MSG;
    await axios.post(`${BASE}/sendMessage/${TOKEN}`, {
      chatId: phone,
      message: reply
    });
    console.log(`Yanıt gönderildi → ${phone}: ${reply.substring(0, 40)}`);
  } catch (e) {
    console.error('Hata:', e.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot ${PORT} portunda çalışıyor`));