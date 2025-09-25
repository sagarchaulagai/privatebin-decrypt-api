# PrivateBin Decrypt API

A Vercel-hosted API for decrypting PrivateBin content. This API accepts JSON data and a decryption key to return the decrypted text content.

## Features

- 🔐 Decrypt PrivateBin content using key and optional password
- 🚀 Serverless deployment on Vercel
- 🌐 CORS enabled for cross-origin requests
- ✅ Input validation and error handling
- 📝 JSON API responses

## API Endpoint

### POST `/api/decrypt`

Decrypts PrivateBin content using the provided key and data.

#### Request Body

```json
{
  "key": "string (required) - Base58 encoded decryption key",
  "password": "string (optional) - Password if the paste was password protected",
  "data": "array (required) - The data array from PrivateBin JSON",
  "cipherMessage": "string (required) - The encrypted message content"
}
```

#### Response

**Success (200):**
```json
{
  "success": true,
  "decryptedText": "The decrypted content"
}
```

**Error (400/500):**
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Usage Examples

### JavaScript/Fetch

```javascript
const response = await fetch('https://your-vercel-app.vercel.app/api/decrypt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: 'your-base58-key',
    password: 'optional-password', // omit if no password
    data: [
      // PrivateBin data array
      ["iv", "salt", 100000, 256, 128, "gcm", "aes", "rawdeflate", 1]
    ],
    cipherMessage: 'encrypted-content-base64'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Decrypted text:', result.decryptedText);
} else {
  console.error('Error:', result.message);
}
```

### cURL

```bash
curl -X POST https://your-vercel-app.vercel.app/api/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "key": "your-base58-key",
    "data": [["iv", "salt", 100000, 256, 128, "gcm", "aes", "rawdeflate", 1]],
    "cipherMessage": "encrypted-content-base64"
  }'
```

### Python

```python
import requests
import json

url = "https://your-vercel-app.vercel.app/api/decrypt"
payload = {
    "key": "your-base58-key",
    "data": [["iv", "salt", 100000, 256, 128, "gcm", "aes", "rawdeflate", 1]],
    "cipherMessage": "encrypted-content-base64"
}

response = requests.post(url, json=payload)
result = response.json()

if result.get("success"):
    print("Decrypted text:", result["decryptedText"])
else:
    print("Error:", result["message"])
```

## How to Get PrivateBin Data

When you have a PrivateBin URL like `https://privatebin.example.com/?id=abc123#key`, you need to:

1. **Extract the key**: The part after `#` in the URL
2. **Fetch the JSON data**: Make a GET request to `https://privatebin.example.com/?id=abc123`
3. **Extract required fields**:
   - `data[0]` - The encryption specification array
   - `ct` - The cipher text (cipherMessage)

Example of fetching PrivateBin data:

```javascript
// Extract from URL: https://privatebin.example.com/?id=abc123#keyhere
const url = 'https://privatebin.example.com/?id=abc123';
const key = 'keyhere';

const response = await fetch(url);
const privateBinData = await response.json();

// Now use with the decrypt API
const decryptResponse = await fetch('/api/decrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: key,
    data: privateBinData.data,
    cipherMessage: privateBinData.ct
  })
});
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to configure your deployment.

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Test the API at `http://localhost:3000/api/decrypt`

## Error Handling

The API includes comprehensive error handling for:

- Missing required fields
- Invalid data formats
- Decryption failures
- Base58 decoding errors
- Cryptographic operation failures

## Security Notes

- This API processes encrypted content and decryption keys
- No data is stored or logged on the server
- All processing happens in memory and is discarded after the request
- Use HTTPS in production to protect data in transit

## Dependencies

- `@scure/base` - For Base58 decoding
- Node.js built-in `crypto` and `zlib` modules

## License

MIT License - feel free to use and modify as needed.
