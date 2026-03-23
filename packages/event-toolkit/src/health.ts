import { createServer, Server, IncomingMessage, ServerResponse } from 'http';

export function createHealthServer(port = 3000): Server {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Health server on :${port}`);
  });

  return server;
}
