import Menu from "./components/Menu";
import "./globals.css";

export const metadata = {
  title: "Origamid Next",
  description: "Criado por Origamid",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Menu />
        {children}
      </body>
    </html>
  );
}
