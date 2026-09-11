import vm from "node:vm";
const scope = {};
vm.createContext(scope);
vm.runInContext(await Deno.readTextFile("assets/js/pauses-actives.js"), scope);
const plan = scope.buildPausePlan;
const base = {start:"09:00", end:"17:00", interval:120, duration:5, lunchEnabled:true, lunchStart:"12:00", lunchEnd:"13:00"};
function check(ok) { if (!ok) throw new Error("Unexpected planning result"); }
Deno.test("pauses: déjeuner exclu et reprise du calcul après déjeuner", () => {
    check(JSON.stringify(plan(base)) === JSON.stringify([{start:660,end:665},{start:900,end:905}]));
});
Deno.test("pauses: sans déjeuner, bornes inclusives et journée courte", () => {
    check(plan({...base,lunchEnabled:false}).length === 3);
    check(plan({...base,lunchEnabled:false,end:"11:05"}).length === 1);
    check(plan({...base,lunchEnabled:false,end:"11:04"}).length === 0);
});
Deno.test("pauses: saisies invalides rejetées", () => {
    for (const update of [{start:"24:00"},{end:"08:00"},{end:"09:00"},{interval:0},{interval:NaN},{interval:16},{duration:0},{duration:1.5},{lunchStart:"08:00"},{lunchEnd:"18:00"},{lunchEnd:"11:00"}]) {
        let rejected = false;
        try { plan({...base,...update}); } catch { rejected = true; }
        check(rejected);
    }
});
Deno.test("pauses: plages extrêmes, aucune collision et durée exacte", () => {
    for (const interval of [15,30,60,120]) {
        const pauses = plan({...base,start:"00:00",end:"23:59",interval,duration:15});
        check(pauses.length < 100);
        for (let i=0;i<pauses.length;i++) {
            const p=pauses[i];
            check(p.end-p.start===15 && p.start>=0 && p.end<=1439);
            check(p.end<=720 || p.start>=780);
            if (i) check(p.start>=pauses[i-1].end+interval);
        }
    }
});
