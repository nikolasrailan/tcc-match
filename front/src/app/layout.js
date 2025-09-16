// front/src/app/layout.js
import Navbar from "./components/Navbar"; // Importe o novo componente
import "./globals.css";

export const metadata = {
  title: "TCC Match",
  description: "Conectando alunos e professores para o TCC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar /> {/* Use o novo componente aqui */}
        <main className="p-8">{children}</main>
      </body>
    </html>
  );
}
