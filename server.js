const express = require('express');
const bodyParser = require('body-parser');
const fernet = require('fernet');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/decrypt', (req, res) => {
  const { token, secret } = req.body;

  if (!token || !secret) {
    return res.status(400).json({ error: 'Missing token or secret in request body' });
  }

  try {
    const secretKey = new fernet.Secret(secret);
    const message = new fernet.Token({
      secret: secretKey,
      token: token,
      ttl: 0
    });

    const decrypted = message.decode();

    try {
      const parsed = JSON.parse(decrypted); // Try to parse inner JSON
      return res.json(parsed);
    } catch (e) {
      return res.json({ decrypted }); // Return as string if not JSON
    }

  } catch (err) {
    return res.status(400).json({ error: 'Decryption failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
