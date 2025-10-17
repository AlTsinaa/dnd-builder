import React from "react";

export default function Spellbook() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-50 text-gray-800 font-sans">
      <h1 className="text-4xl font-bold mb-6">📖 Spellbook</h1>
      <p className="text-lg mb-4">Track and prepare your favorite spells.</p>
      <a href="/" className="text-blue-600 hover:underline">
        ← Back to Home
      </a>
    </div>
  );
}
