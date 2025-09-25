const crypto = require('node:crypto');
const zlib = require('node:zlib');
const base = require('@scure/base');

function stringToArraybuffer(message) {
  const messageArray = new Uint8Array(message.length);
  for (let i = 0; i < message.length; ++i)
    messageArray[i] = message.charCodeAt(i);
  return messageArray;
}

function utf16To8(message) {
  return encodeURIComponent(message).replace(
    /%([0-9A-F]{2})/g,
    (match, hexCharacter) => {
      return String.fromCharCode(Number(`0x${hexCharacter}`));
    }
  );
}

function utf8To16(message) {
  return decodeURIComponent(
    message.split("").map(
      (character) => {
        return `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`;
      }
    ).join("")
  );
}

const base58decode = function(input) {
  return arraybufferToString(
    base.base58.decode(input)
  );
};

function arraybufferToString(messageArray) {
  const array = new Uint8Array(messageArray);
  let message = "";
  let i = 0;
  while (i < array.length)
    message += String.fromCharCode(array[i++]);
  return message;
}

function cryptoSettings({ spec, adata }) {
  return {
    name: `AES-${spec[6].toUpperCase()}`,
    iv: stringToArraybuffer(spec[0]),
    additionalData: stringToArraybuffer(adata),
    tagLength: spec[4]
  };
}

async function deriveKey(key, spec, password) {
  let keyArray = stringToArraybuffer(key);
  if (password) {
    if (spec[7] === "rawdeflate") {
      const passwordBuffer = await crypto.subtle.digest(
        { name: "SHA-256" },
        stringToArraybuffer(
          utf16To8(password)
        )
      ).catch(() => {
        throw new Error("Error while hashing password");
      });
      password = Array.prototype.map.call(
        new Uint8Array(passwordBuffer),
        (x) => `00${x.toString(16)}`.slice(-2)
      ).join("");
    }
    const passwordArray = stringToArraybuffer(password);
    const newKeyArray = new Uint8Array(keyArray.length + passwordArray.length);
    newKeyArray.set(keyArray, 0);
    newKeyArray.set(passwordArray, keyArray.length);
    keyArray = newKeyArray;
  }
  const importedKey = await crypto.subtle.importKey(
    "raw",
    keyArray,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  ).catch(() => {
    throw new Error("Error while importing key");
  });
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: stringToArraybuffer(spec[1]),
      iterations: spec[2],
      hash: { name: "SHA-256" }
    },
    importedKey,
    {
      name: `AES-${spec[6].toUpperCase()}`,
      length: spec[3]
    },
    false,
    ["encrypt", "decrypt"]
  ).catch(() => {
    throw new Error("Error while deriving key");
  });
}

async function zlibInflate(data) {
  return await new Promise((resolve, reject) => {
    zlib.inflateRaw(new Uint8Array(data), (err, buffer) => {
      if (err) {
        reject(new Error("Error while inflating data"));
        return;
      }
      resolve(utf8To16(
        arraybufferToString(buffer)
      ));
    });
  });
}

async function decryptPrivateBin({ key, password, data, cipherMessage }) {
  try {
    key = base58decode(key).padStart(32, "\0");
    const spec = data[0];
    const additionalDataString = JSON.stringify(data);
    spec[0] = atob(spec[0]);
    spec[1] = atob(spec[1]);
    const genCryptoSettings = cryptoSettings({
      adata: additionalDataString,
      spec
    });
    const genKey = await deriveKey(key, spec, password);
    const decryptData = await crypto.subtle.decrypt(
      genCryptoSettings,
      genKey,
      stringToArraybuffer(
        atob(cipherMessage)
      )
    );
    const inflated = await zlibInflate(decryptData);
    const { paste } = JSON.parse(inflated);
    return paste;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { key, password, data, cipherMessage } = req.body;

    // Validate required fields
    if (!key) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Key is required'
      });
    }

    if (!data) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Data is required'
      });
    }

    if (!cipherMessage) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'CipherMessage is required'
      });
    }

    // Validate data structure
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(data[0])) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Data must be an array with at least one spec array'
      });
    }

    // Decrypt the content
    const decryptedText = await decryptPrivateBin({
      key,
      password: password || null,
      data,
      cipherMessage
    });

    return res.status(200).json({
      success: true,
      decryptedText
    });

  } catch (error) {
    console.error('Decryption error:', error);
    return res.status(500).json({
      error: 'Decryption failed',
      message: error.message
    });
  }
}
