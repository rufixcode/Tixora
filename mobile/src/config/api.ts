const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const baseUrl = (
  configuredUrl ||
  "https://tixora-e6rf.onrender.com/api"
).replace(/\/+$/, "");
export const apiBaseUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

export const apiConfigurationHint =
  "Set EXPO_PUBLIC_API_URL to your Laravel API, for example http://192.168.1.10:8000/api when testing on a phone.";
