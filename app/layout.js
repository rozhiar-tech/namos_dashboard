import "./globals.css";
import AuthProvider from "./providers/AuthProvider";

export const metadata = {
  title: "Namo Admin",
  description: "Operations dashboard for the entire fleet",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-slate-100 text-slate-900"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
