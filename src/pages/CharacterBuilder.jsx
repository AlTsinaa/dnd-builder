import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/** =========================
 *  THEME / COLORS (Tailwind)
 *  =========================
 *  Background:   #1b1b1f (ambient dark gray)
 *  Cards:        #232329  (slightly lighter)
 *  Inputs:       #2d2d33
 *  Text:         #e5e1da (warm parchment)
 *  Borders:      purple-gray via border-purple-700 / border-gray-700
 *  Accents:      #fbbf24 (amber)
 */

// ---- Supabase client (env-driven; safe to leave even if you don't use it yet) ----
const supabase =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
    : null;

/* ------------ Data (5e 2014) ------------ */
// Subraces split for clarity; `flex` = how many +1s you can assign to DIFFERENT abilities.
const RACES = [
  // Humans
  { name: "Human", bonus: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
  { name: "Variant Human", bonus: {}, flex: 2 },

  // Dwarves
  { name: "Hill Dwarf", bonus: { CON: 2, WIS: 1 } },
  { name: "Mountain Dwarf", bonus: { CON: 2, STR: 2 } },

  // Elves
  { name: "High Elf", bonus: { DEX: 2, INT: 1 } },
  { name: "Wood Elf", bonus: { DEX: 2, WIS: 1 } },
  { name: "Drow (Dark Elf)", bonus: { DEX: 2, CHA: 1 } },

  // Halflings
  { name: "Lightfoot Halfling", bonus: { DEX: 2, CHA: 1 } },
  { name: "Stout Halfling", bonus: { DEX: 2, CON: 1 } },

  // Gnomes
  { name: "Rock Gnome", bonus: { INT: 2, CON: 1 } },
  { name: "Deep Gnome (Svirfneblin)", bonus: { INT: 2, DEX: 1 } },

  // Others
  { name: "Half-Elf", bonus: { CHA: 2 }, flex: 2 },
  { name: "Half-Orc", bonus: { STR: 2, CON: 1 } },
  { name: "Dragonborn", bonus: { STR: 2, CHA: 1 } },
  { name: "Tiefling", bonus: { CHA: 2, INT: 1 } },
];

const CLASSES = [
  { name: "Barbarian", hitDie: 12, primary: "STR" },
  { name: "Bard", hitDie: 8, primary: "CHA" },
  { name: "Cleric", hitDie: 8, primary: "WIS" },
  { name: "Druid", hitDie: 8, primary: "WIS" },
  { name: "Fighter", hitDie: 10, primary: "STR" },
  { name: "Monk", hitDie: 8, primary: "DEX" },
  { name: "Paladin", hitDie: 10, primary: "CHA" },
  { name: "Ranger", hitDie: 10, primary: "DEX" },
  { name: "Rogue", hitDie: 8, primary: "DEX" },
  { name: "Sorcerer", hitDie: 6, primary: "CHA" },
  { name: "Warlock", hitDie: 8, primary: "CHA" },
  { name: "Wizard", hitDie: 6, primary: "INT" },
];

const SKILLS = [
  { key: "Acrobatics", ability: "DEX" },
  { key: "Animal Handling", ability: "WIS" },
  { key: "Arcana", ability: "INT" },
  { key: "Athletics", ability: "STR" },
  { key: "Deception", ability: "CHA" },
  { key: "History", ability: "INT" },
  { key: "Insight", ability: "WIS" },
  { key: "Intimidation", ability: "CHA" },
  { key: "Investigation", ability: "INT" },
  { key: "Medicine", ability: "WIS" },
  { key: "Nature", ability: "INT" },
  { key: "Perception", ability: "WIS" },
  { key: "Performance", ability: "CHA" },
  { key: "Persuasion", ability: "CHA" },
  { key: "Religion", ability: "INT" },
  { key: "Sleight of Hand", ability: "DEX" },
  { key: "Stealth", ability: "DEX" },
  { key: "Survival", ability: "WIS" },
];

const ABIL_KEYS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

/* ------------ Helpers ------------ */
const mod = (score) => Math.floor((score - 10) / 2);
const profByLevel = (lvl) =>
  lvl >= 17 ? 6 : lvl >= 13 ? 5 : lvl >= 9 ? 4 : lvl >= 5 ? 3 : 2;

// spell slots initialiser (object 1..9 => 0)
const initSpellSlots = () => {
  const slots = {};
  for (let i = 1; i <= 9; i++) slots[i] = 0;
  return slots;
};

/* ================ Component ================ */
export default function CharacterBuilder() {
  // Identity
  const [name, setName] = useState("");
  const [alignment, setAlignment] = useState("Neutral");
  const [backgroundTitle, setBackgroundTitle] = useState("Acolyte");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Choices
  const [raceName, setRaceName] = useState(RACES[0].name);
  const [klass, setKlass] = useState("Fighter");

  // Manual stats
  const [baseStats, setBaseStats] = useState({
    STR: 15,
    DEX: 14,
    CON: 13,
    INT: 12,
    WIS: 10,
    CHA: 8,
  });

  // Racial flex +1s (no duplicates)
  const [flexPicks, setFlexPicks] = useState([]);

  // Defenses & Mobility
  const [ac, setAc] = useState(10);
  const [initiative, setInitiative] = useState(0);
  const [speed, setSpeed] = useState(30);
  const [maxHp, setMaxHp] = useState(10);
  const [tempHp, setTempHp] = useState(0);
  const [currentHp, setCurrentHp] = useState(10);

  // Skills
  const [skillProfs, setSkillProfs] = useState([]);

  // Portrait (dataURL)
  const [portrait, setPortrait] = useState(null);

  // Spell slots (1..9)
  const [spellSlots, setSpellSlots] = useState(initSpellSlots());

  // Spell list (structured)
  const [spells, setSpells] = useState([]); // {id, name, level, time, desc}

  // Character background / notes
  const [backgroundNotes, setBackgroundNotes] = useState("");

  // ---- Autosave: LOAD once ----
  useEffect(() => {
    const raw = localStorage.getItem("dnd_character_builder_v3");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setName(s.name ?? "");
        setAlignment(s.alignment ?? "Neutral");
        setBackgroundTitle(s.backgroundTitle ?? "Acolyte");
        setXp(s.xp ?? 0);
        setLevel(s.level ?? 1);
        setRaceName(s.raceName ?? RACES[0].name);
        setKlass(s.klass ?? "Fighter");
        setBaseStats(s.baseStats ?? baseStats);
        setFlexPicks(s.flexPicks ?? []);
        setAc(s.ac ?? 10);
        setInitiative(s.initiative ?? 0);
        setSpeed(s.speed ?? 30);
        setMaxHp(s.maxHp ?? 10);
        setTempHp(s.tempHp ?? 0);
        setCurrentHp(s.currentHp ?? 10);
        setSkillProfs(s.skillProfs ?? []);
        setPortrait(s.portrait ?? null);
        setSpellSlots(s.spellSlots ?? initSpellSlots());
        setSpells(s.spells ?? []);
        setBackgroundNotes(s.backgroundNotes ?? "");
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Autosave: SAVE on change ----
  useEffect(() => {
    const payload = {
      name,
      alignment,
      backgroundTitle,
      xp,
      level,
      raceName,
      klass,
      baseStats,
      flexPicks,
      ac,
      initiative,
      speed,
      maxHp,
      tempHp,
      currentHp,
      skillProfs,
      portrait,
      spellSlots,
      spells,
      backgroundNotes,
    };
    localStorage.setItem("dnd_character_builder_v3", JSON.stringify(payload));
  }, [
    name,
    alignment,
    backgroundTitle,
    xp,
    level,
    raceName,
    klass,
    baseStats,
    flexPicks,
    ac,
    initiative,
    speed,
    maxHp,
    tempHp,
    currentHp,
    skillProfs,
    portrait,
    spellSlots,
    spells,
    backgroundNotes,
  ]);

  // ---- Derived ----
  const race = useMemo(() => RACES.find((r) => r.name === raceName) || RACES[0], [raceName]);
  const klassInfo = useMemo(() => CLASSES.find((c) => c.name === klass) || CLASSES[4], [klass]);
  const prof = profByLevel(level);
  const maxFlex = race.flex || 0;

  const finalStats = useMemo(() => {
    const out = { ...baseStats };
    if (race.bonus) {
      ABIL_KEYS.forEach((k) => {
        if (race.bonus[k]) out[k] += race.bonus[k];
      });
    }
    if (maxFlex > 0 && flexPicks.length > 0) {
      const used = new Set();
      for (const pick of flexPicks) {
        if (!used.has(pick)) {
          out[pick] += 1;
          used.add(pick);
        }
      }
    }
    return out;
  }, [baseStats, race, flexPicks, maxFlex]);

  // Pre-fill initiative with DEX mod if left as 0
  useEffect(() => {
    if (initiative === 0) setInitiative(mod(finalStats.DEX));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStats.DEX]);

  // ---- Handlers ----
  const updateStat = (key, value) => {
    const v = Number.isNaN(Number(value)) ? 0 : Number(value);
    setBaseStats((prev) => ({ ...prev, [key]: v }));
  };

  const toggleSkill = (skillKey) => {
    setSkillProfs((prev) =>
      prev.includes(skillKey) ? prev.filter((x) => x !== skillKey) : [...prev, skillKey]
    );
  };

  const updateSlot = (lvl, val) => {
    const v = Math.max(0, Number(val) || 0);
    setSpellSlots((prev) => ({ ...prev, [lvl]: v }));
  };

  const addSpell = (spell) => {
    setSpells((prev) => [{ id: crypto.randomUUID(), ...spell }, ...prev]);
  };
  const removeSpell = (id) => setSpells((prev) => prev.filter((s) => s.id !== id));

  // ---- Supabase actions ----
  const saveToCloud = async () => {
    const payload = localStorage.getItem("dnd_character_builder_v3");
    if (!payload) return alert("No character data to save.");
    if (!supabase) return alert("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.");
    const { error } = await supabase.from("characters").insert([{ data: JSON.parse(payload) }]);
    if (error) {
      console.error(error);
      alert("❌ Error saving to Supabase. See console.");
    } else {
      alert("✅ Character saved to cloud!");
    }
  };

  const loadFromCloud = async () => {
    if (!supabase) return alert("Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.");
    const { data, error } = await supabase
      .from("characters")
      .select("data, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return alert("❌ Error loading from Supabase. See console.");
    }
    if (!data) return alert("No cloud character found yet.");

    localStorage.setItem("dnd_character_builder_v3", JSON.stringify(data.data));
    alert("✅ Loaded character from cloud! Refreshing…");
    window.location.reload();
  };

  return (
    <div className="min-h-screen text-[#e5e1da] font-sans p-6 bg-[#1b1b1f] bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(128,90,213,0.18),transparent),radial-gradient(800px_400px_at_90%_10%,rgba(245,158,11,0.08),transparent)]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Ability Scores + Race flex */}
        <section className="lg:col-span-3 space-y-4">
          <Card title="Ability Scores">
            <div className="grid grid-cols-2 gap-3">
              {ABIL_KEYS.map((k) => (
                <div
                  key={k}
                  className="border border-purple-700 rounded-lg p-3 bg-[#2d2d33] text-amber-100 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">{k}</label>
                    <span className="text-xs text-amber-300">
                      Mod {mod(finalStats[k]) >= 0 ? "+" : ""}
                      {mod(finalStats[k])}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={baseStats[k]}
                    onChange={(e) => updateStat(k, e.target.value)}
                    className="w-full mt-2 border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 text-center focus:outline-none focus:border-amber-400"
                  />
                  {finalStats[k] !== baseStats[k] && (
                    <div className="mt-1 text-xs text-amber-300">
                      Final: <b>{finalStats[k]}</b>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Race Bonuses">
            <div className="space-y-2">
              <p className="text-sm">
                <b>{race.name}</b>{" "}
                {race.bonus &&
                  `(fixed: ${Object.entries(race.bonus)
                    .map(([a, n]) => `${a}+${n}`)
                    .join(", ")})`}
              </p>

              {maxFlex > 0 && (
                <>
                  <p className="text-sm">
                    Flexible +1s: pick <b>{maxFlex}</b> different abilities.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {ABIL_KEYS.map((a) => (
                      <label
                        key={a}
                        className={`flex items-center gap-2 text-sm border rounded px-2 py-1 ${
                          flexPicks.includes(a)
                            ? "bg-amber-900/30 border-amber-400"
                            : "bg-[#2d2d33] border-purple-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={flexPicks.includes(a)}
                          onChange={() => {
                            if (flexPicks.includes(a)) {
                              setFlexPicks((p) => p.filter((x) => x !== a));
                            } else if (flexPicks.length < maxFlex) {
                              setFlexPicks((p) => [...p, a]);
                            }
                          }}
                        />
                        {a}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-amber-300">
                    (Half-Elf: CHA+2 plus two other +1s. Variant Human: +1 to two different abilities.)
                  </p>
                </>
              )}
            </div>
          </Card>
        </section>

        {/* MIDDLE: Identity & Skills */}
        <section className="lg:col-span-6 space-y-4">
          <Card title="Identity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Character Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  placeholder="Name"
                />
              </Field>

              <Field label="Character Portrait">
                <div className="flex flex-col items-start gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setPortrait(ev.target.result);
                      reader.readAsDataURL(file);
                    }}
                    className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  />
                  {portrait && (
                    <img
                      src={portrait}
                      alt="Portrait"
                      className="w-32 h-32 object-cover rounded-lg border border-amber-400 shadow-md"
                    />
                  )}
                </div>
              </Field>

              <Field label="Class">
                <select
                  value={klass}
                  onChange={(e) => setKlass(e.target.value)}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                >
                  {CLASSES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Race">
                <select
                  value={raceName}
                  onChange={(e) => {
                    setRaceName(e.target.value);
                    setFlexPicks([]); // reset flex when race changes
                  }}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                >
                  {RACES.map((r) => (
                    <option key={r.name}>{r.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Background">
                <input
                  value={backgroundTitle}
                  onChange={(e) => setBackgroundTitle(e.target.value)}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  placeholder="Acolyte / Soldier / Noble…"
                />
              </Field>

              <Field label="Alignment">
                <input
                  value={alignment}
                  onChange={(e) => setAlignment(e.target.value)}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  placeholder="Neutral Good…"
                />
              </Field>

              <Field label="Hit Die">
                <div className="h-[34px] flex items-center px-2 rounded border border-purple-700 bg-[#2d2d33] text-amber-200">
                  d{klassInfo.hitDie}
                </div>
              </Field>

              <Field label="Primary Ability">
                <div className="h-[34px] flex items-center px-2 rounded border border-purple-700 bg-[#2d2d33] text-amber-200">
                  {klassInfo.primary}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <Field label="Level">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
              <Field label="Proficiency Bonus">
                <div className="h-[34px] flex items-center px-2 rounded border border-purple-700 bg-[#2d2d33] text-amber-200">
                  {prof >= 0 ? "+" : ""}
                  {prof}
                </div>
              </Field>
              <Field label="Experience Points">
                <input
                  type="number"
                  min={0}
                  value={xp}
                  onChange={(e) => setXp(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
            </div>
          </Card>

          <Card title="Skills">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SKILLS.map((s) => {
                const abil = s.ability;
                const total = mod(finalStats[abil]) + (skillProfs.includes(s.key) ? prof : 0);
                return (
                  <label
                    key={s.key}
                    className="flex items-center justify-between border border-purple-700 rounded px-3 py-2 bg-[#2d2d33] text-amber-100"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={skillProfs.includes(s.key)}
                        onChange={() => toggleSkill(s.key)}
                      />
                      <span className="text-sm">
                        {s.key} <span className="text-amber-300">({abil})</span>
                      </span>
                    </span>
                    <span className="font-mono">{total >= 0 ? "+" : ""}{total}</span>
                  </label>
                );
              })}
            </div>
          </Card>
        </section>

        {/* RIGHT: Defenses / HP */}
        <section className="lg:col-span-3 space-y-4">
          <Card title="Defenses & Movement">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Armor Class">
                <input
                  type="number"
                  value={ac}
                  onChange={(e) => setAc(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
              <Field label="Initiative">
                <input
                  type="number"
                  value={initiative}
                  onChange={(e) => setInitiative(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
              <Field label="Speed (ft)">
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
            </div>
            <p className="text-xs text-amber-300 mt-2">
              Tip: Simple unarmored AC = 10 + DEX mod (override as needed).
            </p>
          </Card>

          <Card title="Hit Points">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Max HP">
                <input
                  type="number"
                  min={1}
                  value={maxHp}
                  onChange={(e) => setMaxHp(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
              <Field label="Current HP">
                <input
                  type="number"
                  value={currentHp}
                  onChange={(e) => setCurrentHp(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
              <Field label="Temp HP">
                <input
                  type="number"
                  min={0}
                  value={tempHp}
                  onChange={(e) => setTempHp(Number(e.target.value))}
                  className="w-full border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                />
              </Field>
            </div>
          </Card>

          <Card title="Saving Throws (Mods)">
            <div className="grid grid-cols-3 gap-2 text-sm">
              {ABIL_KEYS.map((k) => (
                <div
                  key={k}
                  className="border border-purple-700 rounded px-2 py-1 bg-[#2d2d33] text-amber-200 text-center shadow-inner"
                >
                  {k}: {mod(finalStats[k]) >= 0 ? "+" : ""}
                  {mod(finalStats[k])}
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* ==================== LOWER STACK: SPELL SLOTS, SPELLS, BACKGROUND, CLOUD SAVE ==================== */}
      <div className="max-w-6xl mx-auto mt-6 space-y-6">
        <Card title="Spell Slots">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, idx) => {
              const lvl = idx + 1;
              return (
                <div
                  key={lvl}
                  className="flex items-center justify-between border border-purple-700 bg-[#2d2d33] px-3 py-2 rounded text-amber-100"
                >
                  <span>Level {lvl} Slots</span>
                  <input
                    type="number"
                    min="0"
                    className="w-20 border border-purple-700 bg-[#232329] text-white rounded px-2 py-1 text-center focus:outline-none focus:border-amber-400"
                    value={spellSlots[lvl] ?? 0}
                    onChange={(e) => updateSlot(lvl, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Spells (Known / Prepared)">
          <AddSpellForm onAdd={addSpell} />
          {spells.length === 0 ? (
            <p className="text-amber-200 mt-2">No spells added yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {spells.map((sp) => (
                <li
                  key={sp.id}
                  className="border border-purple-700 rounded-lg p-3 bg-[#2d2d33] text-amber-100 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-600 text-black font-bold">
                        L{sp.level}
                      </span>
                      <h4 className="font-semibold">{sp.name}</h4>
                      {sp.time && (
                        <span className="text-xs text-amber-300">• {sp.time}</span>
                      )}
                    </div>
                    {sp.desc && (
                      <p className="text-sm text-amber-200 mt-1 whitespace-pre-wrap">
                        {sp.desc}
                      </p>
                    )}
                  </div>
                  <button
                    className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                    onClick={() => removeSpell(sp.id)}
                  >
                    🗑 Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Character Background / Story">
          <textarea
            rows={8}
            value={backgroundNotes}
            onChange={(e) => setBackgroundNotes(e.target.value)}
            placeholder="Write your character's backstory, personality traits, ideals, bonds, and flaws..."
            className="w-full border border-purple-700 bg-[#232329] text-white rounded px-3 py-2 focus:outline-none focus:border-amber-400"
          />
        </Card>

        <Card title="Cloud Save (Supabase)">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
              onClick={saveToCloud}
            >
              💾 Save to Cloud
            </button>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
              onClick={loadFromCloud}
            >
              ☁️ Load Most Recent
            </button>
            <span className="text-sm text-amber-300">
              (Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------- Small UI helpers -------- */
function Card({ title, children }) {
  return (
    <div className="bg-[#232329] border border-purple-700 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <div className="border-b border-purple-700 px-4 py-2 font-semibold tracking-wide text-amber-300">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm block">
      <div className="text-amber-300 mb-1">{label}</div>
      {children}
    </label>
  );
}

/* -------- Add Spell inline form -------- */
function AddSpellForm({ onAdd }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), level: Math.min(9, Math.max(0, Number(level) || 0)), time: time.trim(), desc: desc.trim() });
    setName("");
    setLevel(1);
    setTime("");
    setDesc("");
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start">
      <input
        placeholder="Spell Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="md:col-span-2 border border-purple-700 bg-[#232329] text-white rounded px-3 py-2 focus:outline-none focus:border-amber-400"
      />
      <input
        type="number"
        min="0"
        max="9"
        placeholder="Level"
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        className="border border-purple-700 bg-[#232329] text-white rounded px-3 py-2 focus:outline-none focus:border-amber-400"
      />
      <input
        placeholder="Casting Time (e.g. 1 action)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="border border-purple-700 bg-[#232329] text-white rounded px-3 py-2 focus:outline-none focus:border-amber-400"
      />
      <textarea
        placeholder="Description / notes"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={1}
        className="md:col-span-2 border border-purple-700 bg-[#232329] text-white rounded px-3 py-2 focus:outline-none focus:border-amber-400"
      />
      <button
        type="submit"
        className="md:col-span-6 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded"
      >
        ➕ Add Spell
      </button>
    </form>
  );
}
