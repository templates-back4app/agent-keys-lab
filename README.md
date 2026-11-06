# agent-keys-lab

[![Deploy on Back4app](https://img.shields.io/badge/Deploy%20on-Back4app-1568B8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyIDJMMiA3djEwbDEwIDUgMTAtNVY3eiIvPjwvc3ZnPg==)](https://www.back4app.com/signup?utm_source=github&utm_medium=repo&utm_campaign=agent-keys-lab)

One agent tool — read rows, delete rows, list tables, change permissions —
defined once and run three times, carrying a different credential each time.

This lab does **not** measure whether a model can be talked into calling the
tool. Assume it can: that is what prompt injection is, and it has been
demonstrated against shipping products. What is measured is the part you
control — how far the call reaches once it happens.

**Measured on Parse Server 7.4.0 with MongoDB 7, Docker 29.4.3, 29 October 2026.
Identical across two consecutive clean runs.**

> **Read the article:** [How to Give an AI Agent Database Access Without Giving It Everything](https://www.back4app.com/blog/give-an-ai-agent-database-access-safely?utm_source=github&utm_medium=repo&utm_campaign=agent-keys-lab)

## Run it

```
./run.sh
```

Needs Docker and Node 22. The backend is destroyed and rebuilt every run.

## What it found

| the agent carries | notes read | provider key | table list | delete another's | reopen the table |
| --- | --- | --- | --- | --- | --- |
| the master key | **12 of 12** | **readable** | 5 tables | **done** | **done** |
| one person's session | 4 of 12 | no | refused | refused | refused |
| the public app id | refused | no | refused | refused | refused |

Told to clean up:

```
notes before:                12
notes after:                 0
how long the agent needed:   15 ms
```

The last column is the one that outlives the conversation. A master-key agent can
rewrite the class permissions, and that change stays after the session ends — so
a single bad turn is not a bad answer, it is a configuration change.

## The pieces

| file | what it does |
| --- | --- |
| `agent.mjs` | the tool, defined once, parameterised only by the credential |
| `run.mjs` | the three credentials, the same five questions, and the cleanup |
| `client.mjs` | the ways to call the backend |

Every destructive probe runs against a note owned by somebody other than the
credential holder, so "it worked" never means "it deleted its own row".
