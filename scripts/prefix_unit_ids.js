#!/usr/bin/env node
/*
 * One-time migration script.
 *
 * For every army in each input file:
 *   1. Prepend the army's key to all of ITS OWN unit ids  ->  `${armyKey}_${id}`.
 *   2. Update every reference to those ids inside the SAME army's rules
 *      (requires, excludes, armyValidation, unitPoolRatio, exclusiveGroups,
 *      unitCountValidation, allowedSecondaryUnits, optionalEquipment.*, etc.).
 *
 * It NEVER touches `alliedArmyKeys` and never rewrites references to other
 * armies' ids (those ids are not in the current army's own-id set, so they are
 * left untouched automatically).
 *
 * Usage:  node prefix_unit_ids.js
 * Inputs:  /app/scripts/input/<file>.json   (JSONC allowed)
 * Outputs: /app/scripts/output/<file>.json  (clean pretty JSON)
 */
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "input");
const OUTPUT_DIR = path.join(__dirname, "output");
const FILES = ["dark_ages_armies.json", "chariot_armies.json", "genghis_khan.json"];

/* Same JSONC sanitiser the app uses (comments + trailing commas). */
function stripJsonc(text) {
  let out = "";
  let inStr = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inStr) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === "/" && next === "/") { while (i < text.length && text[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && next === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/* Deep-clone a node while replacing any string that is an own-unit id with its
   prefixed version. The `alliedArmyKeys` subtree is copied verbatim. */
function renameNode(node, map, stats) {
  if (Array.isArray(node)) return node.map((v) => renameNode(v, map, stats));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === "alliedArmyKeys") {
        out[k] = v; // never modify allied-army references
        continue;
      }
      out[k] = renameNode(v, map, stats);
    }
    return out;
  }
  if (typeof node === "string" && Object.prototype.hasOwnProperty.call(map, node)) {
    stats.replacements++;
    return map[node];
  }
  return node;
}

function processArmy(armyKey, army, report) {
  const units = Array.isArray(army.units) ? army.units : [];
  const map = {};
  for (const u of units) {
    if (u && typeof u.id === "string") map[u.id] = `${armyKey}_${u.id}`;
  }
  const stats = { replacements: 0 };
  const updated = renameNode(army, map, stats);
  report.push({ army: armyKey, units: Object.keys(map).length, replacements: stats.replacements });
  return updated;
}

let grand = 0;
for (const file of FILES) {
  const raw = fs.readFileSync(path.join(INPUT_DIR, file), "utf8");
  const data = JSON.parse(stripJsonc(raw));
  const armies = data.armies || data;
  const report = [];
  for (const armyKey of Object.keys(armies)) {
    armies[armyKey] = processArmy(armyKey, armies[armyKey], report);
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, file), JSON.stringify(data, null, 2) + "\n", "utf8");
  const total = report.reduce((s, r) => s + r.replacements, 0);
  const totalUnits = report.reduce((s, r) => s + r.units, 0);
  grand += total;
  console.log(`\n${file}: ${Object.keys(armies).length} armies, ${totalUnits} units renamed, ${total} string refs updated`);
  // show a few armies with the most reference updates
  report.sort((a, b) => b.replacements - a.replacements).slice(0, 3).forEach((r) =>
    console.log(`   ${r.army}: ${r.units} units, ${r.replacements} refs`)
  );
}
console.log(`\nDONE. Total string references updated: ${grand}`);
