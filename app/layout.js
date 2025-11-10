import "./globals.css";

export const metadata = {
  title: "Namo Admin",
  description: "Operations dashboard for the entire fleet",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
