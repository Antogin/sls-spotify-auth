const express = require('express');
const http = require('serverless-http');
const request = require('request');
const querystring = require('querystring');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded());

const redirect_uri = process.env.REDIRECT_URI || 'http://localhost:4500/callback';

app.get('/', (req, res) => {
  res.json({ msg: 'hey u' })
})

app.get('/login', function (req, res) {
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email user-top-read',
      redirect_uri
    })
  );
});

app.get('/callback', function (req, res) {
  console.log(process.env)
  let code = req.query.code || null;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      Authorization:
        'Basic ' +
        new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    json: true
  };
  request.post(authOptions, function (error, response, body) {
    console.log(body);
    const { refresh_token, access_token } = body;
    const uri = process.env.FRONTEND_URI || 'http://localhost:8080/token';
    res.redirect(uri + '?access_token=' + access_token + '&refresh_token=' + refresh_token);
  });
});

app.post('/refresh', function (req, res) {
  let code = req.body.code || null;
  console.log(code);
  console.log(req.body);

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      refresh_token: code,
      grant_type: 'refresh_token'
    },
    headers: {
      Authorization:
        'Basic ' +
        new Buffer(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    json: true
  };
  request.post(authOptions, function (error, response, body) {
    console.log(response.body);
    res.json(response.body);
  });
});

module.exports.handler = http(app)
