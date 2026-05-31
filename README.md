# Prova

**Manual QA that lives in your pull requests.**

Prova is a lightweight tool for running manual test cases against a GitHub pull
request. Work through your checklist, mark each case pass or fail, and Prova posts the
result back to the PR as a status check — `prova/manual-qa: 8/10 passed` — right next to
your CI. Bugs you find become GitHub Issues in one click, and every test run turns into a
shareable report.

Built for solo developers and small teams who want structured manual testing without the
price tag (or complexity) of TestRail.

---

## What you can do

- **Sign in with GitHub** — no separate account to manage.
- **Organize tests** — group test cases into suites. Each case captures everything a
  tester needs: ID, feature, type, priority, preconditions, test data, steps, expected
  result, postconditions, and why it matters.
- **Run a test pass** — pick the cases you want, then execute them one by one. Mark each
  with a keypress: **P** pass · **F** fail · **S** skip · **B** block. Paste a screenshot
  (⌘V) straight onto a case.
- **Get a PR status check** — link a run to a pull request and Prova reports the
  pass rate on the PR automatically.
- **Turn bugs into Issues** — a failed case becomes a labeled GitHub Issue with the steps,
  expected vs. actual, and screenshot, in one click.
- **Share results** — every run has a public report link (no login needed) and an SVG
  badge you can drop in a README.
- **Track progress** — a dashboard shows pass-rate trends, recent runs, and open bugs.
- **Light or dark** — warm, easy-on-the-eyes theme, your choice.

## How it works

1. **Connect a repo.** Open a project, enter your GitHub `owner/repo`, and Prova links it.
2. **Write your test cases.** Add suites and cases describing what to verify.
3. **Open a PR** on that repo — Prova notifies you and offers to start a matching test run.
4. **Run the cases.** Mark pass/fail, attach screenshots, log bugs as you go.
5. **Finish the run.** Prova posts the status check to the PR and gives you a shareable
   report. Sync any bugs to GitHub Issues.

## Pricing

- **Free** — 1 project, unlimited test cases & runs, PR status checks, bug → issue sync,
  shareable reports.
- **Pro** (coming soon) — unlimited projects, custom report branding, analytics.

---

## Self-hosting

Prova is open source (MIT). To run your own instance, see **[DEPLOY.md](./DEPLOY.md)** for
step-by-step deployment, and the deeper technical notes in
[`CLAUDE.md`](./CLAUDE.md) / [`TEST_PLAN.md`](./TEST_PLAN.md).

Stack: React + Vite + Tailwind (web) · Node + Express + MongoDB (API) · Cloudinary
(screenshots) · GitHub OAuth.

## License

[MIT](./LICENSE) © 2026 Oleh Blazhko
