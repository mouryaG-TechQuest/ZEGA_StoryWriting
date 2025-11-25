// Type definitions for httpClient.js
export interface HttpClientConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface HttpClient {
  get(url: string, config?: HttpClientConfig): Promise<any>;
  post(url: string, data?: any, config?: HttpClientConfig): Promise<any>;
  put(url: string, data?: any, config?: HttpClientConfig): Promise<any>;
  delete(url: string, config?: HttpClientConfig): Promise<any>;
}

declare const httpClient: HttpClient;
export default httpClient;
