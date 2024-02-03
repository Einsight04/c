import express from 'express';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const wss = require('./api/ws-server');
const port = 3000;

nextApp.prepare().then(() => {
  const app = express();

  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(port, () => {
    console.log()
  });
});