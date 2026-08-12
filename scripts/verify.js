const fs = require("fs");
function load(p){return JSON.parse(fs.readFileSync(p,"utf8"));}
// output is clean JSON
const out = load("/app/scripts/output/genghis_khan.json").armies.heraclian_byzantine;
console.log("== genghis_khan / heraclian_byzantine ==");
console.log("unit ids:", out.units.map(u=>u.id).join(", "));
// find any rule refs
for (const u of out.units) {
  const refs = {};
  if (u.requires) refs.requires = u.requires;
  if (u.excludes) refs.excludes = u.excludes;
  if (u.allowedSecondaryUnits) refs.allowedSecondaryUnits = u.allowedSecondaryUnits;
  if (Object.keys(refs).length) console.log("  ", u.id, JSON.stringify(refs));
}
if (out.unitPoolRatio) console.log("  unitPoolRatio:", JSON.stringify(out.unitPoolRatio));
if (out.armyValidation) console.log("  armyValidation:", JSON.stringify(out.armyValidation).slice(0,400));
if (out.exclusiveGroups) console.log("  exclusiveGroups:", JSON.stringify(out.exclusiveGroups));
// categories alliedArmyKeys untouched check
for (const c of out.categories||[]) if (c.alliedArmyKeys) console.log("  cat", c.id, "alliedArmyKeys:", JSON.stringify(c.alliedArmyKeys));
