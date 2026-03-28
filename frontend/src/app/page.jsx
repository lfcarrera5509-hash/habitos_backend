"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading) router.push(user ? "/dashboard" : "/login"); }, [user, loading, router]);
  return <div className="home-redirect"><p>Cargando...</p></div>;
}
