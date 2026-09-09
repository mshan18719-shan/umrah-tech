import SessionProvider from "@/components/Auth/SessionProvider";

export default function AuthLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
