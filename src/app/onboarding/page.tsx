"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((s) => s + 1);

  return (
    <div style={{ padding: "24px" }}>
      <h1>Onboarding</h1>

      <p>Step {step} of 4</p>

      {step === 1 && <div>Choose Topics</div>}
      {step === 2 && <div>Add Sources</div>}
      {step === 3 && <div>Check Readiness</div>}
      {step === 4 && <div>Generate Briefing</div>}

      <button onClick={nextStep}>Continue</button>
    </div>
  );
}