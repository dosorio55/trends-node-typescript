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
const MULTIRANGE_INTEREST_OVER_TIME_URL = `${BASE_TRENDS_URL}/api/widgetdata/multirange`;
const INTEREST_BY_REGION_URL = `${BASE_TRENDS_URL}/api/widgetdata/comparedgeo`;
const RELATED_QUERIES_URL = `${BASE_TRENDS_URL}/api/widgetdata/relatedsearches`;
const TRENDING_SEARCHES_URL = `${BASE_TRENDS_URL}/hottrends/visualize/internal/data`;
const TOP_CHARTS_URL = `${BASE_TRENDS_URL}/api/topcharts`;
const SUGGESTIONS_URL = `${BASE_TRENDS_URL}/api/autocomplete/`;
const CATEGORIES_URL = `${BASE_TRENDS_URL}/api/explore/pickers/category`;
const TODAY_SEARCHES_URL = `${BASE_TRENDS_URL}/api/dailytrends`;
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
    // this.GET_METHOD = "GET";
    // this.POST_METHOD = "POST";
    // this.BASE_TRENDS_URL = BASE_TRENDS_URL;
    this.TIMEOUT = timeout;
    this.REQUEST_ARGS = REQUEST_ARGS;
    this.HOST_LANGUAGE = HOST_LANGUAGE;
    this.PROXIES = PROXIES;
    this.PROXY_INDEX = 0;
    this.HEADERS = {
      "accept-language": this.HOST_LANGUAGE,
    };
    //! we will have to check how to transform this into a valid typescript code
  }

  /**
   * This method is used to get a Google 'NID' cookie.
   * It sends a GET request to a Google Trends URL and extracts the 'NID' cookie from the response headers.
   * The method supports using proxies for the requests, and handles proxy errors by changing the proxy.
   * If a proxy error occurs and there are no more proxies left, the method throws the error and ends.
   * The method keeps trying to get the 'NID' cookie until it succeeds or runs out of proxies.
   */
  async getGoogleCookie(): Promise<{ [key: string]: string }> {
    // while (true) {
    // Check if proxies are provided in the request arguments
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

        // Return the 'NID' cookie
        //! GOTTA CHECK THIS CODE, FOR NOW I USE THE IF ELSE
        return {
          NID: nidCookie ? nidCookie.split(";")[0].split("=")[1] : "undefined",
        };
      } catch {
        // If an error occurs, continue to the next iteration of the loop
        // continue;
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
        // Return the 'NID' cookie
        // const response = await axios.get(
        //   `${BASE_TRENDS_URL}/explore/?geo=${this.HOST_LANGUAGE.slice(-2)}`,
        //   {
        //     timeout: this.TIMEOUT,
        //     proxy: { host: proxy, port: 8080 }, // assuming port 8080, adjust as needed
        //     ...this.REQUEST_ARGS,
        //   }
        // );
        // Extract the 'NID' cookie from the response headers
        // return {
        //   NID: nidCookie ? nidCookie.split(";")[0].split("=")[1] : "",
        // };
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
    kwargs: object = {}
  ) {
    // Format the URL with the provided parameters in kwargs
    const urlWithParams = this.formatUrl(url, kwargs);

    // Create a new axios instance
    const requestArgs: RequestInit = {
      method,
      headers: { ...this.HEADERS, Cookie: `NID=${this.COOKIES["NID"]}` },
    };

    //! WE WILL NEED TO CHECK THIS LATER
    /*     const axiosRequest = axios.create({
      // httpsAgent: new https.Agent({ keepAlive: true }),
      headers: this.HEADERS,
      timeout: this.TIMEOUT,
      params: kwargs,
      // proxy:
      //   this.proxies.length > 0
      //     ? { host: this.proxies[this.proxy_index], port: 8080 }
      //     : undefined, // assuming port 8080, adjust as needed
      ...this.REQUEST_ARGS,
    }); */

    // let response: Promise<Response>;

    // const urlTest =
    //   "https://trends.google.es/trends/api/explore?hl=es&tz=-60&req=%7B%22comparisonItem%22:%5B%7B%22keyword%22:%22blockchain%22,%22geo%22:%22ES%22,%22time%22:%22now+1-d%22%7D%5D,%22category%22:0,%22property%22:%22%22%7D&tz=-60";

    try {
      const response = await fetch(urlWithParams, requestArgs);

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
            return jsonResult[responseKey[1]];
          } else {
            throw new Error("JSON is malformed");
          }
        }
      } else {
        if (response.status === 429) {
          // Too Many Requests
          throw new Error("TooManyRequestsError");
        }

        throw new Error("ResponseError");
      }
    } catch (error) {
      console.error(error);
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
    if (
      Object.keys(this.COOKIES).length === 0 &&
      this.COOKIES["NID"] === undefined
    ) {
      // If so, call the asynchronous method getGoogleCookie to fetch the cookie
      // and assign the result to this.COOKIES
      this.COOKIES = await this.getGoogleCookie();
    }
  }

  /**
   * Makes request to Google to get API tokens for interest over time, interest by region and related queries
   */
  async getTokens(): Promise<void> {
    await this.checkCookie();
    // make the request and parse the returned json
    const widget_dicts = await this.getData(
      GENERAL_URL,
      HttpRequestMethod.POST,
      this.TOKEN_PAYLOAD
    );

    if (!widget_dicts) {
      throw new Error("No data returned from Google Trends");
    }

    // order of the json matters...
    let first_region_token = true;

    // clear self.related_queries_widget_list and self.related_topics_widget_list
    // of old keywords'widgets
    this.RELATED_QUERIES_WIDGET_LIST = [];
    this.RELATED_TOPICS_WIDGET_LIST = [];

    // assign requests
    for (const widget of widget_dicts) {
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
   * Request data from Google's Interest Over Time section and return a dataframe
   */
  async interestOverTime(): Promise<any> {
    const over_time_payload = {
      // convert to string as requests will mangle
      req: JSON.stringify(this.INTEREST_OVER_TIME_WIDGET["request"]),
      token: this.INTEREST_OVER_TIME_WIDGET["token"],
      tz: this.TIME_ZONE,
    };

    const responseJson = await this.getData(
      INTEREST_OVER_TIME_URL,
      HttpRequestMethod.GET,
      over_time_payload
    );

    if (!responseJson) {
      throw new Error("An error occurred while fetching data from the API");
    }

    return responseJson;
  }

  //!! gotta work on this later
  async multiRangeInterestOverTime(): Promise<any> {}

  async relatedTopics(): Promise<any> {
    const resultDict: any = {};

    // Loop over each item in the related_topics_widget_list
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

      const responseJson = await this.getData(
        RELATED_QUERIES_URL,
        HttpRequestMethod.GET,
        relatedPayload
      );

      if (!responseJson) {
        throw new Error("An error occurred while fetching data from the API");
      }

      let relatedTop: any;
      let relatedRising: any;

      if (responseJson["rankedList"].length > 0) {
        relatedTop = responseJson["rankedList"][0]["rankedKeyword"];
        relatedRising = responseJson["rankedList"][1]["rankedKeyword"];
      } else {
        relatedTop = null;
        relatedRising = null;
      }

      resultDict[kw] = { top: relatedTop, rising: relatedRising };
    }

    return resultDict;
  }

  /**
   * Define an asynchronous function named 'trendingSearches'
   * The function takes one argument 'pn' which defaults to "united_states" if no value is provided */
  //! ojo, variable sin usar
  async trendingSearches(region: string = "united_states") {
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

  async interestByRegion(
    resolution: "COUNTRY" | "REGION" | "CITY" | "DMA" = "COUNTRY",
    incLowVol: boolean = false,
    //! not used variable
    incGeoCode: boolean = false
  ): Promise<any> {
    // Prepare the request payload
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
    const response = await this.getData(
      INTEREST_BY_REGION_URL,
      HttpRequestMethod.GET,
      regionPayload
    );

    // Assuming response is already parsed JSON
    const data = response.default.geoMapData;

    if (!data || data.length === 0) {
      return []; // Return an empty array if no data
    }

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

    return []; //! Placeholder return
  }

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

      const relatedQueriesResponse = await this.getData(
        RELATED_QUERIES_URL,
        HttpRequestMethod.GET,
        relatedPayload
      );

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

  async todaySearches(pn: string = "US"): Promise<any[]> {
    const todaySearchesPayload = {
      ns: 15,
      geo: pn || this.GEO,
      //! geo: pn, does this have to always be 'US'?
      tz: this.TIME_ZONE,
      //!tz: '-180', does this have to always be -180?
      hl: this.HOST_LANGUAGE,
      // Include other necessary parameters from this.requestsArgs if needed
    };

    const todaySearchedResponse = await this.getData(
      TODAY_SEARCHES_URL,
      HttpRequestMethod.GET,
      todaySearchesPayload
    );

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

  async realTimeTrendingSearches() {
    
  }
}

export default GlTrendRequest;
