import API from "./axios";

// Define a generic payload type
type AuthPayload = {
  email: string;
  password: string;
  [key: string]: any;
};

export const registerCustomer = (payload: AuthPayload) =>
  API.post("/customers/register", payload);

export const loginCustomer = (payload: AuthPayload) =>
  API.post("/customers/login", payload);

export const loginVendor = (payload: AuthPayload) =>
  API.post("/vendors/login", payload);

export const loginAdmin = (payload: AuthPayload) =>
  API.post("/admin/login", payload);
