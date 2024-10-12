const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Shopify, ApiVersion } = require('@shopify/shopify-api');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(','),
  HOST_NAME: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ''),
  API_VERSION: ApiVersion.April23,
  IS_EMBEDDED_APP: true,
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname, query } = parsedUrl;

    if (pathname === '/api/auth') {
      const shop = query.shop;
      if (!shop) {
        res.statusCode = 400;
        res.end('Missing shop parameter');
        return;
      }

      const authRoute = await Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        '/api/auth/callback',
        false
      );
      res.writeHead(302, { Location: authRoute });
      res.end();
    } else if (pathname === '/api/auth/callback') {
      try {
        const session = await Shopify.Auth.validateAuthCallback(
          req,
          res,
          query
        );
        console.log('Session created:', session);
        res.writeHead(302, { Location: '/' });
        res.end();
      } catch (error) {
        console.error('Error validating auth callback:', error);
        res.statusCode = 500;
        res.end(error.message);
      }
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
