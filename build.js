require('@remy/envy');
const request = require('request');
const write = require('fs').writeFile;

const noop = error => error && console.log(error);

function makeFile(short, body) {
  const html = `<!doctype html><title>${
    body.title
  }</title><meta name="description" content="${
    body.description
  }"><link rel="shortcut icon" href="${
    body.favicon
  }"><meta http-equiv="refresh" content="0;${body.redirect}">`;
  write(`./public/${short}.html`, html, noop);
}

request(
  {
    url: `https://jsonbin.org/remy/urls/`,
    json: true,
  },
  (error, res, body) => {
    let redirects = Object.entries(body)
      .filter(([short, target]) => {
        if (typeof target === 'string') {
          return true;
        }

        makeFile(short, target);
        return false;
      })
      .map(([short, url]) => `/${short}${' '.repeat(5)}${url}`)
      .join('\n');

    redirects += `\n/img/RHdwwEfTO5 https://cldup.com/RHdwwEfTO5.png 200\n`;

    write('./public/_redirects', redirects);
  }
);
