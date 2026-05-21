"use client";

// Client-only mount + error boundary for the 3D Lanyard.
// Loaded from the page via next/dynamic({ ssr: false }) so neither the
// r3f/rapier code nor the rapier WASM ever runs during SSR / static build.
// If WebGL or the physics engine fails at runtime, the boundary swallows it
// so the rest of the page (DossierCard) keeps working.

import React from "react";
import dynamic from "next/dynamic";

const Lanyard = dynamic(() => import("@/components/Lanyard"), { ssr: false });

class LanyardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("Lanyard 3D failed to render:", error);
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export default function LanyardStage() {
  return (
    <LanyardErrorBoundary>
      <Lanyard />
    </LanyardErrorBoundary>
  );
}
