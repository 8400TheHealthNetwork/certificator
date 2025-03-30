import axios, { AxiosInstance } from 'axios';

export interface HttpOptions {
  method: string
  header: Record<string, string>
  url: string
  baseUrl: string
  body: any
  params: Record<string, string>
  timeout: number
};

export const server: AxiosInstance = axios.create({ baseURL: process.env.FHIR_SERVER_BASE });

export const http = async (options: HttpOptions) => {
  try {
    if (server) {
      const response = await server.request({
        url: '/' + options.url,
        method: options.method,
        baseURL: options.baseUrl,
        headers: options.header,
        params: options.params,
        data: options.body,
        timeout: options.timeout ?? 10000,
        validateStatus: function (status) {
          return true;
        }
      });
      delete response.config;
      delete response.request;
      return response;
    }
  } catch (e) {
    console.error(e);
    return e;
  }
  return undefined;
};
