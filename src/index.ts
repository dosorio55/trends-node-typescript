import { createServer } from "http";
import GlTrendRequest from "./request";

const PORT = 3001;

const key_words = ["Blockchain"];

const RequesT = new GlTrendRequest();

const sendResponse = (res, data) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const server = createServer(async (req, res) => {
  try {
    await RequesT.buildPayload(key_words); //"Aqui falta un custom hook:"

    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Server is ready and listening.");
    } else if (req.url === "/interest-over-time") {
      const data = await RequesT.interestOverTime();
      sendResponse(res, data);
    } else if (req.url === "/interest-by-region") {
      const data = await RequesT.interestByRegion();
      sendResponse(res, data);
    } else if (req.url === "/related-topics") {
      const data = await RequesT.relatedTopics();
      sendResponse(res, data);
      res.writeHead(200, { "Content-Type": "application/json" });
    } else if (req.url === "/trending-searches") {
      const data = await RequesT.trendingSearches();
      sendResponse(res, data);
    } else if (req.url === "/related-queries") {
      const data = await RequesT.relatedQueries();
      sendResponse(res, data);
    } else if (req.url === "/today-searches") {
      const data = await RequesT.todaySearches();
      sendResponse(res, data);
    } else if (req.url === "/suggestions") {
      const data = await RequesT.suggestions("blockchain");
      sendResponse(res, data);
    } else if (req.url === "/categories") {
      const data = await RequesT.categories();
      sendResponse(res, data);
    } else if (req.url === "/top-charts") {
      const data = await RequesT.topCharts("2014");
      sendResponse(res, data);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(JSON.stringify(error.message));
  }
});

server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
