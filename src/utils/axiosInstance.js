import axios from "axios";

const apii = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true
});

export default apii;
