"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" className="rounded-full" onClick={handleLogout} disabled={loading}>
      <LogOut className="size-4" />
      {loading ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
