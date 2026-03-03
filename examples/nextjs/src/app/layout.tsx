"use client";

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { BusinessRulesProvider, InjectedHookFieldProvider } from "@bghcore/dynamic-forms-core";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BusinessRulesProvider>
            <InjectedHookFieldProvider>
              {children}
            </InjectedHookFieldProvider>
          </BusinessRulesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
