import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CharacterBuilder from "./pages/CharacterBuilder";
import Spellbook from "./pages/Spellbook";
import DiceRoller from "./pages/DiceRoller";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Homepage */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-gray-100 flex flex-col items-center justify-center font-sans">
              <header className="text-center mb-10">
                <h1 className="text-5xl font-extrabold mb-2 tracking-tight text-amber-400 drop-shadow-lg">
                  D&D Character Forge
                </h1>
                <p className="text-lg text-gray-300">
                  Create heroes, roll dice, and manage your spellbook — all in one place.
                </p>
              </header>

              <main className="flex flex-wrap justify-center gap-6 max-w-3xl">
                <Link
                  to="/character"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 py-3 rounded-xl shadow-md transition transform hover:scale-105"
                >
                  🧙 Create Character
                </Link>
                <Link
                  to="/spellbook"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition transform hover:scale-105"
                >
                  📖 Spellbook
                </Link>
                <Link
                  to="/dice"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition transform hover:scale-105"
                >
                  🎲 Dice Roller
                </Link>
              </main>

              <footer className="mt-16 text-sm text-gray-500">
                Made for friends • Powered by <span className="text-amber-400">TailwindCSS</span>
              </footer>
            </div>
          }
        />

        {/* Other Pages */}
        <Route path="/character" element={<CharacterBuilder />} />
        <Route path="/spellbook" element={<Spellbook />} />
        <Route path="/dice" element={<DiceRoller />} />
      </Routes>
    </Router>
  );
}
