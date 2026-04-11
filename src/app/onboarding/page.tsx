"use client";

import { useState } from "react";

const TOPIC_OPTIONS = [
  "AI",
  "Startups",
  "Markets",
  "Product",
  "Design",
  "China",
  "Taiwan",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic]
    );
  };

  const nextStep = () => {
    if (step === 1 && selectedTopics.length === 0) {
      alert("Please choose at least one topic.");
      return;
    }

    if (step < 4) setStep((s) => s + 1);
  };

  const backStep = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "640px", margin: "0 auto" }}>
      <h1>Onboarding</h1>
      <p>Step {step} of 4</p>

      {step === 1 && (
        <div>
          <h2>Choose Topics</h2>
          <p>Select a few topics for your first briefing.</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "16px" }}>
            {TOPIC_OPTIONS.map((topic) => {
              const isSelected = selectedTopics.includes(topic);

              return (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid #ccc",
                    background: isSelected ? "#111" : "#fff",
                    color: isSelected ? "#fff" : "#111",
                    cursor: "pointer",
                  }}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          <p style={{ marginTop: "16px" }}>
            Selected: {selectedTopics.length > 0 ? selectedTopics.join(", ") : "None"}
          </p>
        </div>
      )}

      {step === 2 && <div>Add Sources (next step)</div>}
      {step === 3 && <div>Check Readiness</div>}
      {step === 4 && <div>Generate Briefing</div>}

      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button onClick={backStep} disabled={step === 1}>
          Back
        </button>
        <button onClick={nextStep}>
          {step === 4 ? "Done" : "Continue"}
        </button>
      </div>
    </div>
  );
}
