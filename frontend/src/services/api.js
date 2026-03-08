import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getMetrics = async (brand) => {
  const response = await axios.get(`${API}/metrics/${brand}`);
  return response.data;
};