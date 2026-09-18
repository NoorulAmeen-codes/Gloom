import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/requireUser";

export default async function ProtectedApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}