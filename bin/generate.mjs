// Rebuilds README.md from README.template.md and the live career API.
//
// Only the parts that map from the data unambiguously are generated. The
// badge rows stay hand-written on purpose: shields.io wants a simple-icons
// slug and a hex colour, and the API stores icons8 PNG links — guessing the
// mapping would produce broken or off-brand badges, which is worse than
// editing a line when a stack really changes.
//
//   node bin/generate.mjs           rewrite README.md
//   node bin/generate.mjs --check   fail if it is out of date, write nothing

import { readFileSync, writeFileSync } from "node:fs";

const API = process.env.CAREER_API ?? "https://api.sebas1705.dev";
const CHECK = process.argv.includes("--check");

/** Pick the English side of a LocalizedString, or the value itself. */
const en = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v.en ?? Object.values(v)[0] : v);

async function get(entity) {
  const res = await fetch(`${API}/${entity}`);
  if (!res.ok) throw new Error(`${entity}: HTTP ${res.status}`);
  return res.json();
}

const [personal, jobs, projects, skills, education, certifications, languages] = await Promise.all(
  ["personal", "jobs", "projects", "skills", "education", "certifications", "languages"].map(get),
);

// A profile written from half an API is worse than one written last month.
for (const [name, value] of Object.entries({ jobs, projects, skills, education, certifications })) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} came back empty — refusing to write a profile with a hole in it`);
  }
}

// ── the pieces ───────────────────────────────────────────────────────────────

// The current job is the one with no end date; there should be exactly one.
const current = jobs.find((j) => !j.endDate && !j.end_date);
const role = current ? `${en(current.role)} @ ${current.company}` : en(personal.role);

// Degrees with the period the API records, and nothing inferred from it: a
// profile that says "in progress" about something that finished in June is
// worse than one that simply states the dates.
const study = education
  .filter((e) => !/baccalaureate|bachillerato/i.test(String(en(e.degree) ?? "")))
  .map((e) => `- **${en(e.degree)}** — ${e.school} · ${en(e.period)}`)
  .join(String.fromCharCode(10));

// Three things are deliberately not generated, because the data cannot
// decide them:
//
//   · which languages to lead with — Bash and HTML sit at the same level as
//     TypeScript, so "top by level" is a different question from "what a
//     reader should see first";
//   · which architectures to name — MVC and MVP rank beside Clean
//     Architecture and do not belong next to it on a profile;
//   · which projects are featured — the projects entity has no such flag,
//     so any ordering here would be invented. Adding one to the entity would
//     move this table into the generated half, and that is a change to the
//     data model rather than a guess in a script.
//
// They stay hand-written in the template, where changing them is deliberate.

const counts = {
  projects: projects.length,
  skills: skills.length,
  certifications: certifications.length,
  languages: (languages.supported ?? []).length,
};

// ── stitch ───────────────────────────────────────────────────────────────────

const blocks = {
  role,
  tagline: en(personal.tagline),
  education: study,
  certifications: `- **${counts.certifications} certifications** in Jetpack Compose, Kotlin Multiplatform, SwiftUI, ASP.NET Core, Firebase and Google Cloud`,
  "project-count": String(counts.projects),
};

let out = readFileSync("README.template.md", "utf8");
for (const [key, value] of Object.entries(blocks)) {
  const marker = new RegExp(`<!-- api:${key} -->[\\s\\S]*?<!-- /api:${key} -->`);
  if (!marker.test(out)) throw new Error(`the template has no api:${key} block`);
  out = out.replace(marker, `<!-- api:${key} -->${value}<!-- /api:${key} -->`);
}

const previous = (() => { try { return readFileSync("README.md", "utf8"); } catch { return ""; } })();

if (out === previous) {
  console.log("unchanged");
} else if (CHECK) {
  console.error("README.md is out of date — run node bin/generate.mjs");
  // exitCode rather than exit: a pending fetch handle makes an immediate
  // exit abort on Windows instead of reporting the failure.
  process.exitCode = 1;
} else {
  writeFileSync("README.md", out);
  console.log(
    `rewritten from ${API}: ${counts.projects} projects, ${counts.skills} skills, ${counts.certifications} certifications`,
  );
}