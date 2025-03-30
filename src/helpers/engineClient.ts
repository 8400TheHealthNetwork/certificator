import axios, { AxiosInstance } from 'axios';

// create an axios instance (http client) for engine communication
export const createEngineClient = (enginePort: number): AxiosInstance => axios.create({
  baseURL: `http://localhost:${enginePort.toString()}`,
  // set client to not fail on http error codes
  validateStatus: function (_status) {
    return true;
  }
});
