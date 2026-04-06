// SessionProvider no longer needed — using custom JWT cookie auth
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
