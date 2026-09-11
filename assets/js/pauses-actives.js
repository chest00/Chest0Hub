"use strict";

// Pure calculation, shared by the interface and regression tests.
function buildPausePlan(values) {
    const minutes = (value) => {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value || "")) {
            throw new Error("Renseignez des horaires valides.");
        }
        const [h, m] = value.split(":").map(Number);
        return h * 60 + m;
    };
    const start = minutes(values.start);
    const end = minutes(values.end);
    const interval = Number(values.interval);
    const duration = Number(values.duration);
    if (end <= start) throw new Error("La fin doit suivre le début, dans la même journée.");
    if (!Number.isInteger(interval) || interval < 15 || interval > 120 || interval % 5 !== 0) {
        throw new Error("Choisissez un intervalle de 15 à 120 minutes, par pas de 5.");
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 15) {
        throw new Error("Choisissez une durée entière de 1 à 15 minutes.");
    }
    let blocks = [[start, end]];
    if (values.lunchEnabled) {
        const lunchStart = minutes(values.lunchStart);
        const lunchEnd = minutes(values.lunchEnd);
        if (lunchStart < start || lunchEnd > end || lunchEnd <= lunchStart) {
            throw new Error("Le déjeuner doit être compris dans la journée, avec une fin après son début.");
        }
        blocks = [[start, lunchStart], [lunchEnd, end]];
    }
    const pauses = [];
    for (const [from, to] of blocks) {
        for (let at = from + interval; at + duration <= to; at += interval + duration) {
            pauses.push({start: at, end: at + duration});
        }
    }
    return pauses;
}

if (typeof document !== "undefined") {
    const form = document.getElementById("planning-form");
    const lunch = document.getElementById("lunch-enabled");
    const fields = document.getElementById("lunch-fields");
    const result = document.getElementById("planning-result");
    const error = document.getElementById("planning-error");
    const syncLunch = () => {
        fields.hidden = !lunch.checked;
        fields.querySelectorAll("input").forEach(input => { input.disabled = !lunch.checked; });
    };
    const invalidate = () => { result.hidden = true; error.textContent = ""; };
    form.addEventListener("input", invalidate);
    lunch.addEventListener("change", syncLunch);
    form.addEventListener("reset", () => { invalidate(); setTimeout(syncLunch, 0); });
    const clock = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
    form.addEventListener("submit", event => {
        event.preventDefault();
        invalidate();
        try {
            const values = Object.fromEntries(new FormData(form));
            values.lunchEnabled = lunch.checked;
            const pauses = buildPausePlan(values);
            const list = document.getElementById("planning-list");
            list.replaceChildren();
            for (const pause of pauses) {
                const item = document.createElement("li");
                item.textContent = `${clock(pause.start)} – ${clock(pause.end)} · Pause pour bouger`;
                list.append(item);
            }
            document.getElementById("planning-summary").textContent = pauses.length
                ? `${pauses.length} pause${pauses.length > 1 ? "s" : ""} proposée${pauses.length > 1 ? "s" : ""} · ${pauses.length * Number(values.duration)} minutes au total.`
                : "Aucun créneau ne tient dans ces horaires. Vous pouvez raccourcir l’intervalle ou élargir la journée.";
            document.getElementById("planning-hours").textContent = `Journée : ${values.start} – ${values.end}. Temps entre les pauses : ${values.interval} min. Durée : ${values.duration} min.` + (lunch.checked ? ` Déjeuner : ${values.lunchStart} – ${values.lunchEnd}.` : " Sans déjeuner réservé.");
            result.hidden = false;
            document.getElementById("result-title").focus();
        } catch (issue) { error.textContent = issue.message; }
    });
    document.getElementById("print-planning").addEventListener("click", () => window.print());
    syncLunch();
    document.getElementById("planning-inputs").disabled = false;
}
