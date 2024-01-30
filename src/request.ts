import axios from "axios";

const BASE_TRENDS_URL = "https://trends.google.com/trends";

class GlTrendRequest {
  GET_METHOD: string;
  POST_METHOD: string;
  BASE_TRENDS_URL: string; // replace with your actual base URL
  GENERAL_URL: string = `${BASE_TRENDS_URL}/api/explore`;
  INTEREST_OVER_TIME_URL: string = `${BASE_TRENDS_URL}/api/widgetdata/multiline`;
  MULTIRANGE_INTEREST_OVER_TIME_URL: string = `${BASE_TRENDS_URL}/api/widgetdata/multirange`;
  INTEREST_BY_REGION_URL: string = `${BASE_TRENDS_URL}/api/widgetdata/comparedgeo`;
  RELATED_QUERIES_URL: string = `${BASE_TRENDS_URL}/api/widgetdata/relatedsearches`;
  TRENDING_SEARCHES_URL: string = `${BASE_TRENDS_URL}/hottrends/visualize/internal/data`;
  TOP_CHARTS_URL: string = `${BASE_TRENDS_URL}/api/topcharts`;
  SUGGESTIONS_URL: string = `${BASE_TRENDS_URL}/api/autocomplete/`;
  CATEGORIES_URL: string = `${BASE_TRENDS_URL}/api/explore/pickers/category`;
  TODAY_SEARCHES_URL: string = `${BASE_TRENDS_URL}/api/dailytrends`;
  REALTIME_TRENDING_SEARCHES_URL: string = `${BASE_TRENDS_URL}/api/realtimetrends`;
  ERROR_CODES: number[] = [500, 502, 504, 429];
  TIMEOUT: number;
  REQUEST_ARGS: object;

  constructor(timeout: number = 10000, REQUEST_ARGS: object = {}) {
    this.GET_METHOD = "GET";
    this.POST_METHOD = "POST";
    this.BASE_TRENDS_URL = BASE_TRENDS_URL;
    this.TIMEOUT = timeout;
    this.REQUEST_ARGS = REQUEST_ARGS;
  }

  async getGoogleCookie() {
    // while (true) {}

    try {
      // in this example we are using geo=US
      const response = await axios.get(`${BASE_TRENDS_URL}/explore/?geo=US`, {
        timeout: this.TIMEOUT,
        ...this.REQUEST_ARGS,
      });
      
    } catch (error) {
      console.error(error);
    }
  }
}
