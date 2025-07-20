// Nafith Express API in Node.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
app.use(express.json());

// Constants
const CLIENT_AUTH = "blRrY1RNMkV3Vk1iVFU3SHpGVjVXcnMzeGNZUXc2aVJ6R3dITVU2TjpSNWNGcmFBMTB6WHB3cWUwWTBXN0c3R2t2NWxOZE9SRXh5emp3VnJIR2lTelJVbTdobmc2RkZwVENSRFhjdldSZnBDNDRwbE1mZHl2WGRWVmdpaEQyQ0xFV2NPdjBsQXRJdld4N05Oc1ZMdEgwNDlJYm94UHhEdnkwaml0MGYzRQ==";
const SECRET_KEY = "gQbf1AFZ8OaJs3X03yaT9NiDzPKYWWLFKfi88udI8Qf6U0UAV9QYuCWC3olAGUMHwovK1dqjVtwmOBbSpHl9O7ZJKLHliFoHpRDcZ4a36DPqDtg3J5TToMq9zyWJ467s";
const TOKEN_URL = "https://api.nafith.sa/api/oauth/token/";
const CREATE_SANAD_URL = "https://api.nafith.sa/api/sanad-group/";

// Utility to log debug messages
const debugToScreen = (msg) => console.log("DEBUG MESSAGE:", msg);

// Get Access Token
async function getAccessToken() {
  debugToScreen("Getting Access Token");
  try {
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({ grant_type: 'client_credentials', scope: 'read write' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${CLIENT_AUTH}`,
          'Host': 'api.nafith.sa'
        }
      }
    );
    const token = response.data.access_token;
    debugToScreen(`Access token returned: ${token}`);
    return token;
  } catch (err) {
    console.error("Token Error Response:", err.response?.data || err.message);
    throw new Error("Failed to get access token");
  }
}

// Generate Signature
function calculateHmacSignature(data, method, endpoint, timestamp, secret) {
  debugToScreen("Calculating HMAC Signature");
  const base64Data = Buffer.from(data).toString('base64');
  const message = `${method}\napi.nafith.sa\n${endpoint}\nid=&t=${timestamp}&ed=${base64Data}`;
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('base64');
  debugToScreen(`HMAC Signature: ${hmac}`);
  return hmac;
}

// Create Sanad
async function createSanad(fileData, accessToken, signature, timestamp) {
  debugToScreen("Creating Sanad");
  try {
    const response = await axios.post(
      CREATE_SANAD_URL,
      fileData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Nafith-Timestamp': timestamp,
          'X-Nafith-Tracking-Id': '145',
          'X-Nafith-Signature': signature
        }
      }
    );
    debugToScreen(`Sanad Created: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (err) {
    console.error("Create Sanad Error:", err.response?.data || err.message);
    throw new Error("Failed to create Sanad");
  }
}

// Main route
app.post('/create-sanad', async (req, res) => {
  try {
    const nestedJson = JSON.parse(req.body.data);
    const bodyData = JSON.stringify(nestedJson);

    const accessToken = await getAccessToken();
    const timestamp = Date.now();
    const signature = calculateHmacSignature(bodyData, "POST", "/api/sanad-group/", timestamp, SECRET_KEY);

    const result = await createSanad(bodyData, accessToken, signature, timestamp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(3000, () => console.log('Server running on port 3000'));
