<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Prova server-side Node.js application. A new singleton PostHog client was created in `server/utils/posthog.js` and wired into ten route and middleware files. User identification runs on every GitHub OAuth login. Twelve business events are now captured across the full user journey — from first sign-in through project creation, GitHub repo connection, test execution, and bug reporting. Exception tracking was added to the global Express error handler so every unhandled server error is sent to PostHog automatically.

**Note:** `posthog-node` must be installed manually before starting the server — the sandbox could not write to `server/node_modules`. Run:
```bash
cd server && npm install posthog-node
```

| Event name | Description | File |
|---|---|---|
| `user signed in` | GitHub OAuth callback — identifies the user and captures sign-in | `server/routes/auth.js` |
| `project created` | New QA project created (free-tier check passed) | `server/routes/projects.js` |
| `project deleted` | Project and all cascaded children deleted | `server/routes/projects.js` |
| `github repo connected` | GitHub repo linked to project, webhook registered | `server/routes/github.js` |
| `github repo disconnected` | GitHub repo unlinked from project | `server/routes/github.js` |
| `test suite created` | New test suite added to a project | `server/routes/suites.js` |
| `test case created` | New test case added to a suite | `server/routes/cases.js` |
| `test run started` | Test run created with a set of selected cases | `server/routes/runs.js` |
| `test run completed` | Test run finalized with pass/fail counts and PR status | `server/routes/runs.js` |
| `bug reported` | Bug report filed, optionally linked to a run and case | `server/routes/bugs.js` |
| `bug synced to github` | Bug report pushed to a GitHub Issue | `server/routes/bugs.js` |
| `pr webhook received` | GitHub PR-opened webhook received and notification created | `server/routes/webhooks.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/191488/dashboard/717985)
- [Daily active users (sign-ins)](https://eu.posthog.com/project/191488/insights/UopRXMn4)
- [User activation funnel](https://eu.posthog.com/project/191488/insights/ZotZMPL6) — sign-in → project created → GitHub connected → test run completed
- [Test runs completed per day](https://eu.posthog.com/project/191488/insights/wgm5l3DA)
- [Bug → GitHub sync rate](https://eu.posthog.com/project/191488/insights/NS3VOKFs) — % of bugs pushed to GitHub Issues
- [Project churn — created vs deleted](https://eu.posthog.com/project/191488/insights/w54IdtTJ)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
