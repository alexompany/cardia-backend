const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));

app.post('/completions', async (req, res) => {
  try {
    const { image_base64 } = req.body;

    if (!image_base64) {
      return res.status(400).json({ error: 'Falta imagen en base64' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const result = await model
      .generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: image_base64,
          },
        },
        {
          text: `Actúa como cardiólogo experto. Evalúa este EKG según guías clínicas actualizadas. Devuelve:

- Frecuencia cardíaca (lpm)
- Ritmo
- Intervalo PR
- QRS
- QTc
- Eje eléctrico
- ST/T
- Diagnóstico
- Comentario (máx. 2 líneas)

No expliques términos. No digas que eres IA. Solo responde clínicamente.`,
        },
      ])
      .catch(err => {
        console.error('❌ Gemini error:', err);
        throw new Error('Falló el análisis con Gemini');
      });

    const text = result.response.text();
    res.json({ content: text });

  } catch (error) {
    console.error('❌ Error general:', error.message || error);
    res.status(500).json({ error: 'Error al procesar imagen con Gemini. Intenta con otra imagen más ligera o espera unos segundos.' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ Servidor Gemini de CardIA activo');
});

app.listen(port, () => {
  console.log(`🚀 Servidor CardIA escuchando en puerto ${port}`);
});
