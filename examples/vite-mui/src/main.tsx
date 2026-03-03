import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { BusinessRulesProvider, InjectedHookFieldProvider } from "@bghcore/dynamic-forms-core";
import App from "./App";

const theme = createTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BusinessRulesProvider>
        <InjectedHookFieldProvider>
          <App />
        </InjectedHookFieldProvider>
      </BusinessRulesProvider>
    </ThemeProvider>
  </React.StrictMode>
);
