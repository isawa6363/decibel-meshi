const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const API_KEY = process.env.API_KEY;
const PORT = 3000;

function googlePost(endpoint, fieldMask, bodyObj, res) {
  bodyObj.languageCode = 'ja';
  bodyObj.regionCode = 'JP';
  const body = JSON.stringify(bodyObj);
  const req = https.request({
    hostname: 'places.googleapis.com',
    path: endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': fieldMask,
      'Content-Length': Buffer.byteLength(body)
    }
  }, (apiRes) => {
    let data = '';
    apiRes.on('data', d => data += d);
    apiRes.on('end', () => {
      res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(data);
    });
  });
  req.on('error', e => { res.writeHead(500); res.end(JSON.stringify({error:e.message})); });
  req.write(body);
  req.end();
}

function googleGet(path2, fieldMask, res) {
  https.request({
    hostname: 'places.googleapis.com',
    path: path2,
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': fieldMask,
      'Accept-Language': 'ja'
    }
  }, (apiRes) => {
    let data = '';
    apiRes.on('data', d => data += d);
    apiRes.on('end', () => {
      res.writeHead(200, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(data);
    });
  }).on('error', e => { res.writeHead(500); res.end(JSON.stringify({error:e.message})); }).end();
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-Goog-FieldMask'});
    res.end();
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/api/search') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const bodyObj = JSON.parse(body);
        googlePost('/v1/places:searchText', 'places.id,places.displayName,places.rating,places.userRatingCount,places.shortFormattedAddress', bodyObj, res);
      } catch(e) { res.writeHead(400); res.end(JSON.stringify({error:'bad request'})); }
    });
    return;
  }

  if (req.method === 'GET' && parsed.pathname.startsWith('/api/place/')) {
    const placeId = parsed.pathname.replace('/api/place/', '');
    googleGet('/v1/places/' + placeId + '?languageCode=ja', 'id,displayName,rating,userRatingCount,shortFormattedAddress,reviews', res);
    return;
  }

  if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('デシベルめし起動: http://localhost:' + PORT);
});
