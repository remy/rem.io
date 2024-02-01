require('@remy/envy');
const writeFileSync = require('fs').writeFileSync;

const noop = (error) => error && console.log(error);

function makeFile(short, body) {
  const html = `<!doctype html><title>${body.title}</title><meta name="description" content="${body.description}"><link rel="shortcut icon" href="${body.favicon}"><meta http-equiv="refresh" content="0;${body.redirect}">`;
  try {
    writeFileSync(`./public/${short}.html`, html);
  } catch (e) {
    noop(e);
  }
}

fetch(`https://jsonbin.org/remy/urls/`)
  .then((_) => _.json())
  .then((body) => {
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

    writeFileSync('./public/_redirects', redirects);
  });
