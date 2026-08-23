export const adminRootMetadata = {
  robots: { index: false, follow: false },
};

export function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-sand/40">{children}</div>
  );
}
