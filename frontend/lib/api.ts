import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: API_URL });

// Injeta token automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login em 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, lgpdConsent = false) =>
    api.post("/auth/login", { email, password, lgpd_consent: lgpdConsent }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// ── Insumos ──────────────────────────────────────────────────────────────────
export const ingredientsApi = {
  list: (params?: object) => api.get("/ingredients", { params }),
  create: (data: object) => api.post("/ingredients", data),
  update: (id: string, data: object) => api.patch(`/ingredients/${id}`, data),
  remove: (id: string) => api.delete(`/ingredients/${id}`),
};

// ── Produtos ─────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params?: object) => api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: object) => api.post("/products", data),
  update: (id: string, data: object) => api.patch(`/products/${id}`, data),
  updatePrice: (id: string, price: number) => api.patch(`/products/${id}/price`, { selling_price: price }),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/products/${id}/photo`, form);
  },
};

// ── Receitas ─────────────────────────────────────────────────────────────────
export const recipesApi = {
  getByProduct: (productId: string) => api.get(`/recipes/product/${productId}`),
  create: (data: object) => api.post("/recipes", data),
  update: (id: string, data: object) => api.patch(`/recipes/${id}`, data),
};

// ── Markup ────────────────────────────────────────────────────────────────────
export const markupApi = {
  listRules: () => api.get("/markup/rules"),
  createRule: (data: object) => api.post("/markup/rules", data),
  updateRule: (id: string, data: object) => api.patch(`/markup/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/markup/rules/${id}`),
  suggestPrices: () => api.get("/markup/suggest-prices"),
  promotions: () => api.get("/markup/promotions"),
};

// ── Relatórios ───────────────────────────────────────────────────────────────
export const reportsApi = {
  cmvOverview: () => api.get("/reports/cmv-overview"),
  abcCurve: () => api.get("/reports/abc-curve"),
};

// ── WhatsApp ─────────────────────────────────────────────────────────────────
export const whatsappApi = {
  saveConfig: (data: object) => api.post("/whatsapp/config", data),
  sendFicha: (productId: string, phone: string) =>
    api.post("/whatsapp/send-ficha", { product_id: productId, phone }),
};

// ── Importação Excel ──────────────────────────────────────────────────────────
function _downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const importsApi = {
  downloadIngredientTemplate: async () => {
    const r = await api.get("/import/template/ingredients", { responseType: "blob" });
    _downloadBlob(r.data, "modelo_insumos.xlsx");
  },
  importIngredients: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/import/ingredients", form);
  },
  deleteAllIngredients: () => api.delete("/import/ingredients/all"),
  downloadProductTemplate: async () => {
    const r = await api.get("/import/template/products", { responseType: "blob" });
    _downloadBlob(r.data, "modelo_produtos.xlsx");
  },
  importProducts: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/import/products", form);
  },
};
