const express = require('express');
const fs = require('fs');
const request = require('request');
const parse = require('url').parse;
const dotenv = require('dotenv');
const log = require('inline-log');
const cache = {};
const app = express();

dotenv.config({ silent: true });

console.log(process.env.JSONBIN_TOKEN);

function get(file) {
  return new Promise((resolve, reject) => {
    request({
      url: `https://jsonbin.org/remy/urls/${file}`,
      headers: {
        authorization: `token ${process.env.JSONBIN_TOKEN}`
      }
    }, (err, res, body) => {
      if (err) {
        return reject(err);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(res.statusCode));
      }

      resolve(body.trim());
    });
  });
}

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('x-powered-by', 'rabbits');
  next();
});

app.use('/_log', log());

app.get('/*', (req, res) => {
  res.setHeader('x-route', 'main');
  const url = parse(req.url);

  // poor man's sanity
  const file = url.pathname.replace(/\./g, '').replace(/^\//, '');

  if (file && cache[file] === undefined) {
    // one off readsync - quick and dirty
    return get(file).then(url => {
      cache[file] = url;
      res.redirect(302, cache[file]);
    }).catch(e => {
      console.log('failed ' + req.url);
      console.log(e.message);
      res.status(404).send('Not found');
    });
  }

  if (cache[file]) {
    return res.redirect(302, cache[file]);
  }

  res.sendStatus(404);
});

app.listen(process.env.PORT || 8000);
