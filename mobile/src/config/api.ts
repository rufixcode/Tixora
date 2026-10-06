const configuredUrl = process.env.EXPO_PUBLIC_API_URL;

export const apiBaseUrl = (configuredUrl ?? 'http://10.0.2.2:8000/api').replace(/\/+$/, '');

export const apiConfigurationHint = 'Set EXPO_PUBLIC_API_URL to your Laravel API, for example http://192.168.1.10:8000/api when testing on a phone.';
