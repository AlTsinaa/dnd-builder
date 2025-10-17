import React from "react";

export default function DiceRoller() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 text-gray-800 font-sans">
      <h1 className="text-4xl font-bold mb-6">🎲 Dice Roller</h1>
      <p className="text-lg mb-4">Roll dice for attacks, checks, and damage!</p>
      <a href="/" className="text-blue-600 hover:underline">
        ← Back to Home
      </a>
    </div>
  );
}
