import { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "e280237e-cba7-411a-8fa5-e9d58883f1e7",
    authority: "https://login.microsoftonline.com/0b9cef37-e9f5-4d4e-8714-f947e79248ac",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ["https://analysis.windows.net/powerbi/api/Report.Read.All"],
};

export const powerBIScopes = ["https://analysis.windows.net/powerbi/api/Report.Read.All"];
