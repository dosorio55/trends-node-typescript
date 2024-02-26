import { createServer } from "http";
import GlTrendRequest from "./request";

const PORT = 3000;

const key_words = ["Blockchain"];

const RequesT = new GlTrendRequest();

async function fetchDataAndRespond(key_words, res) {
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

const fetchInterestByRegion = async (key_words) => {
  try {
    await RequesT.buildPayload(key_words); //"Aqui falta un custom hook:"
    const data = await RequesT.interestByRegion();
    return data;
  } catch (err) {
    console.log(err);
  }
};

const fetchRelatedTopics = async (key_words) => {
  try {
    await RequesT.buildPayload(key_words); //"Aqui falta un custom hook:"
    const data = await RequesT.relatedTopics();
    return data;
  } catch (err) {
    console.log(err);
  }
};

const server = createServer(async (req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Server is ready and listening.");
  } else if (req.url === "/interest-over-time") {
    await fetchDataAndRespond(key_words, res);
  } else if (req.url === "/interest-by-region") {
    await fetchInterestByRegion(key_words);
  } else if (req.url === "/related-topics") {
    await fetchRelatedTopics(key_words);
  } else if (req.url === "/trending-searches") {
    await RequesT.trendingSearches();
  } else if (req.url === "/related-queries") {
    await RequesT.buildPayload(key_words);
    await RequesT.relatedQueries();
  } else if (req.url === "/today-searches") {
    await RequesT.buildPayload(key_words);
    await RequesT.todaySearches();
  } else if (req.url === "/suggestions") {
    await RequesT.suggestions("blockchain");
  } else if (req.url === "/categories") {
    await RequesT.categories();
  } else if (req.url === "/top-charts") {
    await RequesT.topCharts("2014");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
