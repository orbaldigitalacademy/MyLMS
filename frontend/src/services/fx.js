import api from "./api";

export const fxAPI = {
  localize: (base = "NGN") =>
    api.get("/fx/localize", {
      params: { base },
    }),

  getRate: (base = "NGN", to = "USD") =>
    api.get("/fx/rate", {
      params: { base, to },
    }),

  getCurrencies: () => api.get("/fx/currencies"),
};
