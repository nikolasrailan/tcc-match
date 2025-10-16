import Navbar from "./components/Navbar";
import "./globals.css";

export const metadata = {
  title: "TCC Match",
  description: "Conectando alunos e professores para o TCC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="">
      <body>
        <Navbar />
        <main className="p-4 sm:p-6 md:p-8">{children}</main>
      </body>
    </html>
  );
}
