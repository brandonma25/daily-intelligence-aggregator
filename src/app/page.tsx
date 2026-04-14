"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/auth-modal";
import HeroSection from "@/components/landing/hero";

export default function Page() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <main>
      <HeroSection onGetStarted={() => setAuthModalOpen(true)} />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </main>
  );
}
