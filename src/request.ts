import axios, { AxiosResponse } from "axios";
import {
  InterestByRegionWidget,
  RelatedQueries,
  intByRegionWidgetInitial,
} from "./type";

const BASE_TRENDS_URL = "https://trends.google.com/trends";

enum HttpRequestMethod {
  GET = "GET",
  POST = "POST",
}

interface Headers {
  [key: string]: string;
}

const GENERAL_URL = `${BASE_TRENDS_URL}/api/explore`;
const INTEREST_OVER_TIME_URL = `${BASE_TRENDS_URL}/api/widgetdata/multiline`;
const INTEREST_BY_REGION_URL = `${BASE_TRENDS_URL}/api/widgetdata/comparedgeo`;
const RELATED_QUERIES_URL = `${BASE_TRENDS_URL}/api/widgetdata/relatedsearches`;
const TRENDING_SEARCHES_URL = `${BASE_TRENDS_URL}/hottrends/visualize/internal/data`;
const TOP_CHARTS_URL = `${BASE_TRENDS_URL}/api/topcharts`;
const SUGGESTIONS_URL = `${BASE_TRENDS_URL}/api/autocomplete/`;
const CATEGORIES_URL = `${BASE_TRENDS_URL}/api/explore/pickers/category`;
const TODAY_SEARCHES_URL = `${BASE_TRENDS_URL}/api/dailytrends`;
const MULTIRANGE_INTEREST_OVER_TIME_URL = `${BASE_TRENDS_URL}/api/widgetdata/multirange`;
const REALTIME_TRENDING_SEARCHES_URL = `${BASE_TRENDS_URL}/api/realtimetrends`;

class GlTrendRequest {
  HEADERS: Headers;
  KEYWORDS_LIST: string[] = [];
  ERROR_CODES: number[] = [500, 502, 504, 429];
  TIMEOUT: number;
  REQUEST_ARGS: object;
  PROXY_INDEX: number;
  PROXIES: string[] = []; //! this seems to be an array of strings, but in the default value of the original code says "", I'll check this later
  HOST_LANGUAGE: string;
  COOKIES: { [key: string]: string } = {};
  GEO: string = "US";
  TOKEN_PAYLOAD: object = {};
  TIME_ZONE: string = "0";
  INTEREST_OVER_TIME_WIDGET: object = {};
  INTEREST_BY_REGION_WIDGET: InterestByRegionWidget = intByRegionWidgetInitial;
  RELATED_QUERIES_WIDGET_LIST: RelatedQueries[] = [];
  RELATED_TOPICS_WIDGET_LIST: object[] = [];

  constructor(
    timeout: number = 10000,
    REQUEST_ARGS: object = {},
    HOST_LANGUAGE: string = "en-US",
    PROXIES: string[] = []
  ) {
    this.TIMEOUT = timeout;
    this.REQUEST_ARGS = REQUEST_ARGS;
    this.HOST_LANGUAGE = HOST_LANGUAGE;
    this.PROXIES = PROXIES;
    this.PROXY_INDEX = 0;
    this.HEADERS = {
      "accept-language": this.HOST_LANGUAGE,
    };
  }

  /**
   * This method is used to get a Google 'NID' cookie.
   * It sends a GET request to a Google Trends URL and extracts the 'NID' cookie from the response headers.
   * The method supports using proxies for the requests, and handles proxy errors by changing the proxy.
   * If a proxy error occurs and there are no more proxies left, the method throws the error and ends.
   * The method keeps trying to get the 'NID' cookie until it succeeds or runs out of proxies.
   */
  async getGoogleCookie(): Promise<{ [key: string]: string }> {
    if ("proxies" in this.REQUEST_ARGS) {
      try {
        // Send a GET request to the Google Trends URL
        const response = await axios.get(
          `${BASE_TRENDS_URL}/explore/?geo=${this.HOST_LANGUAGE.slice(-2)}`,
          {
            timeout: this.TIMEOUT,
            ...this.REQUEST_ARGS,
          }
        );
        // Extract the 'NID' cookie from the response headers
        const cookies = response.headers["set-cookie"];
        const nidCookie = cookies?.find((cookie: string) =>
          cookie.startsWith("NID")
        );

        return {
          NID: nidCookie ? nidCookie.split(";")[0].split("=")[1] : "undefined",
        };
      } catch (error) {
        console.error(error);
      }
    } else {
      let proxy = "";
      // Check if there are any proxies available
      if (this.PROXIES.length > 0) {
        // Select a proxy using the proxy index
        //! IT SEEMS THIS IS AN STRING, BUT MAKES NO SENSE FOR ME, I'LL CHECK THIS LATER
        proxy = this.PROXIES[this.PROXY_INDEX];
      }

      try {
        // Send a GET request to the Google Trends URL using the selected proxy
        const response = await fetch(
          `${BASE_TRENDS_URL}/explore/?geo=${this.HOST_LANGUAGE.slice(
            -2
          ).trim()}`
        );
        const cookies = response.headers.get("set-cookie");

        // Extract the 'NID' cookie from the response headers
        if (cookies) {
          for (const coockieValue of cookies?.split("; ")) {
            const splitedCookie = coockieValue.split("=");
            const name = splitedCookie[0];
            if (name === "NID") {
              const value = splitedCookie.slice(1).join("=");
              return { [name]: value };
            }
          }
        }
      } catch (error) {
        // If a proxy error occurs
        if (error.code === "ECONNRESET") {
          console.log("Proxy error. Changing IP");
          // If there are more than one proxies, remove the problematic proxy
          if (this.PROXIES.length > 1) {
            this.PROXIES.splice(this.PROXY_INDEX, 1);
          } else {
            // If there are no more proxies left, throw the error and end the method
            console.log("No more proxies available. Bye!");
            throw error;
          }
          // Continue to the next iteration of the loop
          // continue;
        }
      }
    }
    // }
  }

  formatUrl(url: string, kwargs: object): string {
    const URLEntity = new URL(url);
    for (const paramKey in kwargs) {
      let paramValue = kwargs[paramKey];
      if (typeof paramValue === "object") {
        paramValue = JSON.stringify(paramValue);
      }
      URLEntity.searchParams.append(paramKey, paramValue);
    }

    return URLEntity.toString();
  }

  async getData(
    url: string,
    method: HttpRequestMethod = HttpRequestMethod.GET,
    kwargs: object,
    newUrl?: string
  ): Promise<{ data: any; error: string | null }> {
    const urlWithParams = this.formatUrl(url, kwargs);

    const requestArgs: RequestInit = {
      method,
      headers: { ...this.HEADERS, Cookie: `NID=${this.COOKIES["NID"]}` },
    };

    try {
      const response = await fetch(newUrl || urlWithParams, requestArgs);

      if (response.status === 200) {
        const contentType = response.headers.get("content-type");

        if (
          contentType.includes("application/json") ||
          contentType.includes("application/javascript") ||
          contentType.includes("text/javascript")
        ) {
          // Get a new proxy
          //! I'LL CHECK THIS LATER, we will have to create the method GetNewProxy
          // this.GetNewProxy(); // assuming this method exists
          // Trim initial characters
          const responseText = await response.text();

          const regex = /{"(\w+)":/;
          const jsonStartIndex: number = responseText.search(regex);
          const responseKey = responseText.match(regex);

          if (jsonStartIndex !== -1 && responseKey && responseKey[1]) {
            const jsonText = responseText.substring(jsonStartIndex);
            const jsonResult = JSON.parse(jsonText);
            return { data: jsonResult[responseKey[1]], error: null };
          } else {
            throw new Error("JSON is malformed");
          }
        }
      } else {
        if (response.status === 429) {
          // Too Many Requests
          throw new Error("429 ERROR, too many requests");
        }

        throw new Error("ResponseError");
      }
    } catch (error) {
      console.error(error);
      return { data: null, error: error.message };
    }
  }

  //Create the payload for related queries, interest over time and interest by region
  async buildPayload(
    kw_list: string[],
    cat: number = 0,
    timeframe: string = "today 12-m",
    geo: string = "",
    gprop: string = ""
  ): Promise<void> {
    if (!["", "images", "news", "youtube", "froogle"].includes(gprop)) {
      throw new Error(
        "gprop must be empty (to indicate web), images, news, youtube, or froogle"
      );
    }
    this.KEYWORDS_LIST = kw_list;
    this.GEO = geo || this.GEO;
    this.TOKEN_PAYLOAD = {
      hl: this.HOST_LANGUAGE,
      tz: this.TIME_ZONE,
      req: { comparisonItem: [], category: cat, property: gprop },
    };

    // Check if timeframe is a list
    if (Array.isArray(timeframe)) {
      for (let index = 0; index < this.KEYWORDS_LIST.length; index++) {
        const kw = this.KEYWORDS_LIST[index];
        const keyword_payload = {
          keyword: kw,
          time: timeframe[index],
          geo: this.GEO,
        };
        this.TOKEN_PAYLOAD["req"]["comparisonItem"].push(keyword_payload);
      }
    } else {
      // build out json for each keyword with
      for (const kw of this.KEYWORDS_LIST) {
        const keyword_payload = { keyword: kw, time: timeframe, geo: this.GEO };
        this.TOKEN_PAYLOAD["req"]["comparisonItem"].push(keyword_payload);
      }
    }

    // requests will mangle this if it is not a string
    this.TOKEN_PAYLOAD["req"] = JSON.stringify(this.TOKEN_PAYLOAD["req"]);
    // get tokens
    await this.getTokens();
  }

  /**
   * Asynchronous method to check and update the cookie if necessary.
   */
  async checkCookie() {
    // Check if the COOKIES object is empty or the "NID" property is undefined
    // if (
    //   Object.keys(this.COOKIES).length === 0 &&
    //   this.COOKIES["NID"] === undefined
    // ) {
    // If so, call the asynchronous method getGoogleCookie to fetch the cookie
    // and assign the result to this.COOKIES
    this.COOKIES = await this.getGoogleCookie();
    // }
  }

  /**
   * Makes request to Google to get API tokens
   */
  async getTokens(): Promise<void> {
    await this.checkCookie();
    // make the request and parse the returned json
    const { error, data } = await this.getData(
      GENERAL_URL,
      HttpRequestMethod.POST,
      this.TOKEN_PAYLOAD
      // "https://trends.google.com/trends/api/explore?hl=es&tz=-60&req=%7B%22comparisonItem%22:%5B%7B%22keyword%22:%22Monaco+%E2%80%93+paris-sg%22,%22geo%22:%22FR%22,%22time%22:%22now+1-d%22%7D%5D,%22category%22:0,%22property%22:%22%22%7D&tz=-60"
      // "https://trends.google.fr/trends/explore?q=Monaco%20%E2%80%93%20paris-sg&date=now%201-d&geo=FR&hl=es"
      // "https://trends.google.com/trends/explore?q=blockchain&date=now%201-d&geo=FR&hl=es"
    );

    if (!data) {
      throw new Error("No data returned from Google Trends");
    }

    if (error) {
      throw new Error(error);
    }

    let first_region_token = true;

    // clear self.related_queries_widget_list and self.related_topics_widget_list
    // of old keywords'widgets
    this.RELATED_QUERIES_WIDGET_LIST = [];
    this.RELATED_TOPICS_WIDGET_LIST = [];

    // assign requests
    for (const widget of data) {
      if (widget.id === "TIMESERIES") {
        this.INTEREST_OVER_TIME_WIDGET = widget;
        continue;
      }
      if (widget.id === "GEO_MAP" && first_region_token) {
        this.INTEREST_BY_REGION_WIDGET = widget;
        first_region_token = false;
        continue;
      }
      // response for each term, put into a list
      if (widget.id.includes("RELATED_TOPICS")) {
        this.RELATED_TOPICS_WIDGET_LIST.push(widget);
        continue;
      }
      if (widget.id.includes("RELATED_QUERIES")) {
        this.RELATED_QUERIES_WIDGET_LIST.push(widget);
        continue;
      }
    }
  }

  /**
   * Fetches historical search interest for a given keyword from Google Trends' Interest Over Time section.
   * Provides a timeline of the keyword's popularity, useful for identifying trends and peak interest periods.
   *
   * @returns {Promise<any>} - A promise that resolves to an object containing interest over time data.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API.
   */
  async interestOverTime(): Promise<any> {
    const over_time_payload = {
      // convert to string as requests will mangle
      req: JSON.stringify(this.INTEREST_OVER_TIME_WIDGET["request"]),
      token: this.INTEREST_OVER_TIME_WIDGET["token"],
      tz: this.TIME_ZONE,
    };

    const { error, data } = await this.getData(
      INTEREST_OVER_TIME_URL,
      HttpRequestMethod.GET,
      over_time_payload
    );

    if (error) throw new Error(error);

    if (!data) {
      throw new Error("An error occurred while fetching data from the API");
    }

    return data;
  }

  /**
   * Fetches and returns data for keywords related to a specified keyword, as indicated
   * in Google Trends' Related Topics section. This function identifies and provides insights
   * into topics that are contextually linked to the input keyword, offering a broader
   * perspective on the keyword's search interest landscape. Such data can be instrumental
   * in understanding associated trends, expanding keyword research, and identifying
   * potential areas for content development or marketing strategies.
   *
   * @returns {Promise<any>} - A promise that resolves to an object containing related topics for each request.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API or if no data is found for a request.
   */
  async relatedTopics(): Promise<any> {
    const resultDict: any = {};

    for (const request_json of this.RELATED_TOPICS_WIDGET_LIST) {
      let kw: string;
      try {
        kw =
          request_json["request"]["restriction"]["complexKeywordsRestriction"][
            "keyword"
          ][0]["value"];
      } catch (error) {
        kw = "";
      }

      const relatedPayload = {
        req: JSON.stringify(request_json["request"]),
        token: request_json["token"],
        tz: this.TIME_ZONE,
      };

      const { error, data } = await this.getData(
        RELATED_QUERIES_URL,
        HttpRequestMethod.GET,
        relatedPayload
      );

      if (error) throw new Error(error);

      if (!data) {
        throw new Error("An error occurred while fetching data from the API");
      }

      let relatedTop: any;
      let relatedRising: any;

      if (data["rankedList"].length > 0) {
        relatedTop = data["rankedList"][0]["rankedKeyword"];
        relatedRising = data["rankedList"][1]["rankedKeyword"];
      } else {
        relatedTop = null;
        relatedRising = null;
      }

      resultDict[kw] = { top: relatedTop, rising: relatedRising };
    }

    return resultDict;
  }

  /**
   * Retrieves and returns data on the latest trending searches, as displayed in
   * the Google Trends' Trending Searches section. This method provides a snapshot
   * of the most current popular searches, reflecting what topics are gaining
   * attention globally or in specific regions, depending on the implementation.
   *
   * @param {string} [region="united_states"] - The region for which to fetch the trending searches. Defaults to "united_states".
   * @returns {Promise<any>} - A promise that resolves to an object containing trending searches for the specified region.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API or if no data is found for the provided region.
   */
  async trendingSearches(region: string = "united_states"): Promise<any> {
    try {
      const searchesResponse = await fetch(TRENDING_SEARCHES_URL);

      if (searchesResponse.status === 200) {
        const dataForAllContries = await searchesResponse.json();

        if (dataForAllContries[region]) {
          return dataForAllContries[region];
        } else {
          throw new Error("no data found for the provided region");
        }
      } else {
        throw new Error("Error while fetching trending searches");
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Retrieves search interest by region for a keyword from Google Trends' Interest by Region section.
   * Highlights areas with the highest search volumes for the keyword.
   *
   * @returns {Promise<any>} - A promise that resolves to an object containing related queries.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API.
   */
  async interestByRegion(
    resolution: "COUNTRY" | "REGION" | "CITY" | "DMA" = "COUNTRY",
    incLowVol: boolean = false,
    //! not used variable
    incGeoCode: boolean = false
  ): Promise<any> {
    if (this.GEO === "") {
      this.INTEREST_BY_REGION_WIDGET.request.resolution = resolution;
    } else if (
      this.GEO === "US" &&
      ["DMA", "CITY", "REGION"].includes(resolution)
    ) {
      this.INTEREST_BY_REGION_WIDGET.request.resolution = resolution;
    }

    this.INTEREST_BY_REGION_WIDGET.request.includeLowSearchVolumeGeos =
      incLowVol;

    // Convert to string as HTTP request libraries might mangle objects
    const regionPayload = {
      req: JSON.stringify(this.INTEREST_BY_REGION_WIDGET.request),
      token: this.INTEREST_BY_REGION_WIDGET.token,
      tz: this.TIME_ZONE,
    };

    // Perform the request
    const { error, data } = await this.getData(
      INTEREST_BY_REGION_URL,
      HttpRequestMethod.GET,
      regionPayload
      // "https://trends.google.com/trends/api/widgetdata/comparedgeo?hl=es&tz=-60&req=%7B%22geo%22:%7B%22country%22:%22FR%22%7D,%22comparisonItem%22:%5B%7B%22time%22:%222024-03-01T08%5C%5C:16%5C%5C:05+2024-03-02T08%5C%5C:16%5C%5C:05%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22BROAD%22,%22value%22:%22blockchain%22%7D%5D%7D%7D%5D,%22resolution%22:%22REGION%22,%22locale%22:%22es%22,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D,%22userConfig%22:%7B%22userType%22:%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAZeQxxSpWEZ4vHIakRgxhtYPXEoCpWERW"
    );

    if (error) throw new Error(error);

    // Assuming response is already parsed JSON
    const result = data.geoMapData;

    if (!result || result.length === 0) {
      return []; // Return an empty array if no data
    }

    return result;

    // Transform the response data into a suitable structure
    // This part would require replacing pandas functionality with TypeScript logic
    // Below comments suggest the logic that needs to be replicated in TypeScript

    /* 
  const df = pd.DataFrame(data);
  if (df.empty) {
      return df;
  }

  const geoColumn = df.columns.includes('geoCode') ? 'geoCode' : 'coordinates';
  const columns = ['geoName', geoColumn, 'value'];
  df = df[columns].setIndex(['geoName']).sortIndex();

  const resultDf = df['value'].apply(x => pd.Series(
      x.toString().replace('[', '').replace(']', '').split(',')
  ));

  if (incGeoCode) {
      if (df.columns.includes(geoColumn)) {
          resultDf[geoColumn] = df[geoColumn];
      } else {
          console.log('Could not find geo_code column; Skipping');
      }
  }

  for (let idx = 0; idx < this.kwList.length; idx++) {
      const kw = this.kwList[idx];
      resultDf[kw] = resultDf[idx].astype('int');
      delete resultDf[idx];
  }
  */

    // The TypeScript version will need to replicate the DataFrame manipulation logic
    // using JavaScript arrays and objects or a suitable data manipulation library

    return [];
  }

  /**
   * Retrieves related queries for a keyword from Google Trends' Related Queries section.
   * Useful for discovering associated search terms.
   *
   * @returns {Promise<any>} - A promise that resolves to an object containing related queries.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API.
   */
  async relatedQueries(): Promise<any> {
    const resultDict: { [key: string]: { top: any; rising: any } } = {};

    for (const requestJson of this.RELATED_QUERIES_WIDGET_LIST) {
      let kw: string;
      try {
        kw =
          requestJson.request.restriction.complexKeywordsRestriction.keyword[0]
            .value;
      } catch {
        kw = "";
      }

      const relatedPayload = {
        req: JSON.stringify(requestJson.request),
        token: requestJson.token,
        tz: this.TIME_ZONE,
      };

      const { error, data } = await this.getData(
        RELATED_QUERIES_URL,
        HttpRequestMethod.GET,
        relatedPayload,
        // "https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=es&tz=-60&req=%7B%22restriction%22:%7B%22geo%22:%7B%22country%22:%22FR%22%7D,%22time%22:%222024-03-01T08%5C%5C:16%5C%5C:05+2024-03-02T08%5C%5C:16%5C%5C:05%22,%22originalTimeRangeForExploreUrl%22:%22now+1-d%22,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22BROAD%22,%22value%22:%22blockchain%22%7D%5D%7D%7D,%22keywordType%22:%22ENTITY%22,%22metric%22:%5B%22TOP%22,%22RISING%22%5D,%22trendinessSettings%22:%7B%22compareTime%22:%222024-02-29T08%5C%5C:16%5C%5C:05+2024-03-01T08%5C%5C:16%5C%5C:05%22%7D,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22CM%22,%22category%22:0%7D,%22language%22:%22es%22,%22userCountryCode%22:%22FR%22,%22userConfig%22:%7B%22userType%22:%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAZeQxxSX21JTQKPpWdJMHBlMzO9DlXCDk"
      );

      if (error) throw new Error(error);

      const relatedQueriesResponse = data;

      if (
        relatedQueriesResponse &&
        relatedQueriesResponse.rankedList.length > 0
      ) {
        const topQueries =
          relatedQueriesResponse.rankedList[0]?.rankedKeyword?.map(
            (rk: any) => ({
              query: rk.query,
              value: rk.value,
            })
          );

        const risingQueries =
          relatedQueriesResponse.rankedList[1]?.rankedKeyword?.map(
            (rk: any) => ({
              query: rk.query,
              value: rk.value,
            })
          );

        resultDict[kw] = { top: topQueries, rising: risingQueries };
      } else {
        resultDict[kw] = { top: null, rising: null };
      }
    }

    return resultDict;
  }

  /**
   * Retrieves today's trending searches for a specified country.
   *
   * @param {string} [countryCode="US"] Country code to fetch trending searches for. Defaults to "US".
   * @returns {Promise<any[]>} Promise resolving to today's trending searches.
   * @throws {Error} If fetching data from the API fails.
   */
  async todaySearches(countryCode: string = "US"): Promise<any[]> {
    const todaySearchesPayload = {
      ns: 15,
      geo: countryCode || this.GEO,
      tz: this.TIME_ZONE,
      hl: this.HOST_LANGUAGE,
    };

    const { error, data } = await this.getData(
      TODAY_SEARCHES_URL,
      HttpRequestMethod.GET,
      todaySearchesPayload
    );

    if (error) throw new Error(error);

    const todaySearchedResponse = data;

    if (
      todaySearchedResponse &&
      todaySearchedResponse["trendingSearchesDays"].length > 0
    ) {
      const reqJson =
        todaySearchedResponse["trendingSearchesDays"][0]?.["trendingSearches"];
      const result = reqJson.map(
        (trend: any) => trend.title.query || "Unknown"
      );

      return result;
    } else {
      throw new Error("An error occurred while fetching data from the API");
    }
  }

  /**
   * Retrieves suggested keywords to refine a trend search.
   *
   * @param {string} keyword - The keyword for which to fetch the suggestions.
   * @returns {Promise<any>} - A promise that resolves to an array of suggestions for the given keyword.
   * @throws {Error} - Throws an error if there is a problem fetching the data from the API.
   */
  async suggestions(keyword: string): Promise<any> {
    const kwParam = encodeURIComponent(keyword);
    const parameters = { hl: this.HOST_LANGUAGE };

    const { error, data } = await this.getData(
      `${SUGGESTIONS_URL}${kwParam}`,
      HttpRequestMethod.GET,
      parameters
    );

    if (error) throw new Error(error);

    return data["topics"];
  }

  /**
   * Retrieves a hierarchical list of Google Trends' categories with unique IDs.
   * These categories enable precise filtering for trend queries, facilitating targeted
   * analysis in specific areas of interest.
   *
   * Ideal for segmenting trend data by sectors like technology, health, finance, or
   * entertainment, enhancing the relevance and specificity of trend insights.
   *
   * @returns {Promise<any>} Promise resolving to the categories structure, enabling
   * refined trend query construction based on topic-specific interests.
   */
  async categories(): Promise<any> {
    const params = { hl: this.HOST_LANGUAGE };

    const reqJson = await this.getData(
      CATEGORIES_URL,
      HttpRequestMethod.GET,
      params
    );

    return reqJson;
  }

  /**
   * Retrieves Google Trends' Top Charts data for a given topic, showing popular searches and trends.
   * Provides insights into what subjects are currently garnering significant interest across different categories.
   *
   * Useful for market research, content strategy, and identifying trending interests.
   *
   * @param {string} date - format YYYY, The year for which to fetch the top charts.
   * @returns {Promise<any[] | null>} - A promise that resolves to an array of top charts for the given year, or null if no data is found.
   * @throws {Error} - Throws an error if the date is not a valid year or if there is a problem fetching the data from the API.
   */
  async topCharts(date: string): Promise<any[] | null> {
    const year = parseInt(date, 10);

    if (isNaN(year))
      throw new Error("The date must be a year with format YYYY");

    const chartPayload = {
      hl: this.HOST_LANGUAGE,
      tz: this.TIME_ZONE,
      date: year,
      geo: this.GEO,
      isMobile: false,
    };

    try {
      const { error, data } = await this.getData(
        TOP_CHARTS_URL,
        HttpRequestMethod.GET,
        chartPayload
      );

      if (error) throw new Error(error);

      if (data?.[0]?.listItems) {
        return data[0].listItems;
      } else {
        throw new Error("No data found for the provided date");
      }
    } catch (error) {
      console.error("Error fetching top charts data:", error);
      return null;
    }
  }

  async realTimeTrendingSearches() {}

  async multiRangeInterestOverTime(): Promise<any> {}
}

export default GlTrendRequest;
