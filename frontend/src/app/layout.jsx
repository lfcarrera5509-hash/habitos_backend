import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";
export const metadata = { title: "Habitos Tracker", description: "Seguimiento de habitos" };
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
