const fs = require("fs");
const files = ["dark_ages_armies.json","chariot_armies.json","genghis_khan.json"];
let problems = 0, checked = 0;
for (const f of files){
  const data = JSON.parse(fs.readFileSync(`/app/scripts/output/${f}`,"utf8"));
  const armies = data.armies || data;
  for (const [key,army] of Object.entries(armies)){
    const newIds = (army.units||[]).map(u=>u.id);
    // reconstruct bare old ids by stripping the "<key>_" prefix
    const bareOld = new Set(newIds.filter(id=>id.startsWith(key+"_")).map(id=>id.slice(key.length+1)));
    // every unit id must be prefixed
    for (const u of army.units||[]) if (!u.id.startsWith(key+"_")) { console.log(`  [${f}] ${key}: unit id NOT prefixed -> ${u.id}`); problems++; }
    // scan whole army (except alliedArmyKeys) for any string == a bare old id
    (function scan(node){
      if (Array.isArray(node)) return node.forEach(scan);
      if (node && typeof node==="object"){
        for (const [k,v] of Object.entries(node)){ if (k==="alliedArmyKeys") continue; scan(v);} return;
      }
      if (typeof node==="string" && bareOld.has(node)){ console.log(`  [${f}] ${key}: leftover bare ref -> "${node}"`); problems++; }
    })(army);
    checked++;
  }
}
console.log(`\nArmies checked: ${checked} | problems: ${problems}`);
