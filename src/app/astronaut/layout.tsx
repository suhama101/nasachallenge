export const dynamic = "force-dynamic";
// Authorization is repeated in every page/action, not trusted to a cached layout.
export default function AstronautLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
