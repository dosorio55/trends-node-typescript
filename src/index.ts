// import  * as http from 'http';
import { createServer } from "http";

const server = createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is ready and listening.");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const PORT = 3000;
server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);


