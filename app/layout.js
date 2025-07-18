import "./globals.css";

export const metadata = {
  title: "Lamo Admin",
  description: "Admin dashboard for Lamo’s Taxi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <div className="min-h-screen flex flex-col">
          <header className="bg-black text-white p-4 font-bold text-lg">
            Namo Admin Dashboard
          </header>
          <main className="flex-grow p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
