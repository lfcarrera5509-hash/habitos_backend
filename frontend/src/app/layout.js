import "./globals.css";
import StoreProvider from "../lib/StoreProvider";

export const metadata = {
  title: "Habitos",
  description: "Semana 2 - Next + Redux",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}