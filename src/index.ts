import { createServer } from "http";
import GlTrendRequest from "./request";

const PORT = 3000;

const key_words = ["Blockchain"];

const RequesT = new GlTrendRequest();

async function fetchDataAndRespond(RequesT: GlTrendRequest, key_words, res) {
  try {
    await RequesT.buildPayload(key_words);

    const data = await RequesT.interestOverTime();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.log(err);
    res.writeHead(500, { "Content-Type": "text/plain" });
  }
}

const server = createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is ready and listening.");
  } else if (req.url === "/interest-over-time") {
    await fetchDataAndRespond(RequesT, key_words, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
