// Simple test for the PrivateBin decrypt API
const https = require('https');

// Your data
const privateBinData = {"status":0,"id":"f21932e89ee38047","url":"\/?f21932e89ee38047","adata":[["R47R+AHV387CtS7+jIcjVg==","c9zlMA3G39k=",100000,256,128,"aes","gcm","zlib"],"markdown",0,0],"v":2,"ct":"ickZV0VBHjVETAclWBxQfFzeEgN95IT5Iro7LBfdDiOBjVRlYlw95xH2QvIjZ71jbMBy3tknq\/GqfeLbRWa9ZQHrcVIhNvVdN1gy0M\/2IDaa\/GU\/v1IvNXegq4Ki9mFYZPeDx9tOQ\/SH5BoBQO08kirYKF\/0Dj8XBQlCgmhhoN0AkQoxz\/7vfdQhjs8b3gW6vrDreSqu3XR6j\/ApUTIERZ85htvViusZVvsClGi8nFxbrgA7UVY=","meta":{"created":1757003058},"comments":[],"comment_count":0,"comment_offset":0,"@context":"?jsonld=paste"};

const key = "Ewmu6w4qHEDSHxMxAr5Wm789bi9oe2mB7WVkqU1UX42x";

// Prepare the request data
const requestData = {
  key: key,
  data: privateBinData.adata,
  cipherMessage: privateBinData.ct
};

const postData = JSON.stringify(requestData);

const options = {
  hostname: 'privatebin-decrypt-api.vercel.app',
  port: 443,
  path: '/api/decrypt',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};


const req = https.request(options, (res) => {
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Raw Response:', data);
    
    try {
      const jsonResponse = JSON.parse(data);
      console.log('✅ Parsed Response:', JSON.stringify(jsonResponse, null, 2));
      
      if (jsonResponse.success) {
        console.log('🎉 SUCCESS! Decrypted text:');
        console.log(jsonResponse.decryptedText);
      } else {
        console.log('❌ FAILED:', jsonResponse.message);
      }
    } catch (error) {
      console.log('❌ Failed to parse JSON response:', error.message);
      console.log('Raw response was:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(postData);
req.end();
