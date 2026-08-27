# How this profile is built

`README.md` is **generated**. Editing it directly works until the next
Monday, when the workflow overwrites it.

```sh
node bin/generate.mjs           # rewrite README.md from the live API
node bin/generate.mjs --check   # fail if it is stale, write nothing
```

## What comes from the API

The role and employer, the tagline, the number of projects, the degrees with
their periods, and the certification count — all read from
[api.sebas1705.dev](https://api.sebas1705.dev/docs) at build time. Change them
in [Folio](https://github.com/Sebas1705Carreer/career-editor-kmp) and they
appear here on the next run.

## What is hand-written, and why

Everything else lives in `README.template.md`, including three things the data
deliberately does not decide:

- **The languages to lead with.** Bash and HTML sit at the same skill level as
  TypeScript, so "top by level" answers a different question from "what should
  a reader see first".
- **The architectures named.** MVC and MVP rank beside Clean Architecture in
  the data and do not belong beside it on a profile.
- **The featured projects.** The `projects` entity has no flag for it, so any
  ordering here would be invented — an early version of the generator put
  Codewars katas above Templetry. Adding a `featured` field to the entity
  would move this table into the generated half; that is a change to the data
  model, not a guess in a script.

The badge rows are hand-written too: shields.io wants a simple-icons slug and a
hex colour, and the API stores icons8 PNG links.

## The rule

The generator refuses to write a profile from a half-empty API — an entity
coming back empty is an error, not a reason to publish a profile with a hole
in it.
