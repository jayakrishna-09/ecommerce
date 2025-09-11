import API from "./axios";

export const registerCustomer = (payload) => API.post("/customers/register", payload);
export const loginCustomer = (payload) => API.post("/customers/login", payload);

// vendor & admin endpoints if needed
export const loginVendor = (payload) => API.post("/vendors/login", payload);
export const loginAdmin = (payload) => API.post("/admin/login", payload);

