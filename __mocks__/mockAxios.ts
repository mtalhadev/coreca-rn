import axios from "axios";
import MockAdapter from "axios-mock-adapter";

const mockAxios = new MockAdapter(axios, { delayResponse: 100 });

export default mockAxios;