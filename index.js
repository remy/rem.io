const express = require('express');
const fs = require('fs');
const request = require('request');
const parse = require('url').parse;
const dotenv = require('dotenv');
const cache = {};
const app = express();

dotenv.config({ silent: true });

function get(file) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: `https://jsonbin.org/remy/urls/${file}`,
        headers: {
          authorization: `token ${process.env.JSONBIN_TOKEN}`,
        },
        json: true,
      },
      (err, res, body) => {
        if (err) {
          return reject(err);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(res.statusCode));
        }

        const result = {
          url: '',
          status: '',
        };

        if (typeof body === 'string') {
          result.url = body.trim();
          result.status = 302;
        } else {
          result.status = 200;
          result.body = `<!doctype html><title>${
            body.title
          }</title><meta name="description" content="${
            body.description
          }"><link rel="shortcut icon" href="${
            body.favicon
          }"><meta http-equiv="refresh" content="0;${body.redirect}">`;
        }

        resolve(result);
      }
    );
  });
}

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('x-powered-by', 'rabbits');
  next();
});

app.use(express.static(__dirname + '/public'));

app.delete('/*', (req, res) => {
  const url = parse(req.url);
  const file = url.pathname.replace(/\./g, '').replace(/^\//, '');
  delete cache[file];
  res.sendStatus(200);
});

app.get('/*', (req, res) => {
  res.setHeader('x-route', 'main');
  const url = parse(req.url);

  // poor man's sanity
  const file = url.pathname.replace(/\./g, '').replace(/^\//, '');

  if (file && cache[file] === undefined) {
    // one off readsync - quick and dirty
    return get(file)
      .then(result => {
        cache[file] = result;
        if (result.status === 302) {
          res.redirect(302, cache[file].url);
        } else {
          res.status(result.status).send(result.body);
        }
      })
      .catch(e => {
        console.log('failed ' + req.url);
        console.log(e.message);
        res.status(404).send('Not found');
      });
  }

  if (cache[file]) {
    if (cache[file].status === 302) {
      return res.redirect(302, cache[file].url);
    }
    return res.status(200).send(cache[file].body);
  }

  res.sendStatus(404);
});

app.listen(process.env.PORT || 8000);
