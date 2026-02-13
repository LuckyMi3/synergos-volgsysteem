"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMockRole } from "../lib/currentUser";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = getMockRole();
    if (role === "admin") router.replace("/admin");
    else if (role === "teacher") router.replace("/docent");
    else router.replace("/student");
  }, [router]);

  return <div style={{ padding: 40 }}>Doorsturen…</div>;
}
