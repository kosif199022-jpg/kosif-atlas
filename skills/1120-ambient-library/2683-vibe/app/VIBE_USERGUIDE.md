# vibe — User Guide

## What vibe does

vibe is a mode for your AI coding agent. While the mode is on, each change
request goes through a loop. The loop writes tests, builds the change, runs
the app, and looks at it. It fixes problems and commits the work.

You see two messages for each request:

- **Checks.** The agent tells you what it will build and what it assumes.
- **Result.** The agent shows what works, with screenshots or a sample run.

## Turn vibe mode on

1. Open your agent in the app folder.
2. Type `vibe on`.

If the folder has the vibe stamp, the mode is always on. You do not need to type
`vibe on`.

## Turn vibe mode off

1. Type `vibe off` or `normal mode`.

The mode stays off until the end of the conversation. To turn off the mode
permanently, delete the `## vibe mode` section from `.aai/instructions.md`.

## Ask for a new feature

1. Describe the feature in your own words.
2. Read the checks and assumptions.
3. If the agent asks questions, answer them. Each question has a default. To
   use the default, type `yes`.
4. Wait for the result message.

If the agent has no questions, it continues without a reply from you. A large
request is divided into slices. The agent commits each slice.

The agent always asks before it decides some items. These items are the data
model, logins, paid services, deletion of your data, and the stack of a new app.

## Build a full app

1. Describe the app in your own words.
2. Answer the questions. The agent asks one question in each message. To use
   the recommended default, type `yes`.
3. Read the handoff message. It shows the decisions and the list of
   components.
4. Wait. The agent builds each component and sends a short note after each one.
5. Read the result message at the end.

The agent stops before the end only if it must ask about one of the items in
the previous section. The plan is in `PLAN.md` in the app folder.

## Continue a build in a new session

1. Open your agent in the app folder.
2. Type `continue`.

The agent starts the next component that is not done.

## Report a bug

1. Describe what you did and what went wrong.
2. Wait for the result message.

The agent writes a test that shows the bug before it changes the code. The
test stays in the app, so the same bug cannot return without a test failure.

## Accept or change a result

1. Look at the screenshots or the sample run.
2. Try the app.
3. Do one of these steps:
   - To accept the result, type your next request.
   - To change the result, type your feedback.
   - To remove the last change, type `undo that`.

## Ask a question about the app

1. Type the question.

A question does not start the loop. The agent answers, and it does not
change files.

## Read the app documents

vibe keeps four documents in the app folder. It updates them before each commit.

| Document | Contents |
|---|---|
| `README.md` | What the app does, install, and quickstart |
| `USERGUIDE.md` | How to do each task in the app |
| `PRD.md` | Requirements |
| `FUNCSPEC.md` | How the app works |

## Troubleshooting

| Problem | Cause | Action |
|---|---|---|
| The agent asks many questions during the build | The mode is off | Type `vibe on` |
| A question started the loop | The request sounded like a change request | Type `vibe off`, and then ask again |
| The result shows a stuck item | A gate failed five times | Read the recommendation. Then give the missing item, or change the request. |
| The result says that an API key is missing | The app needs a key that is not available | Put the key in the `.env` file. Then type `try again`. |
| The e2e gate cannot start | Playwright has no browser | Run `npx playwright install chromium` |
| A folder with an `.aai/` folder does not use vibe | The installer does not change an existing profile | Type `vibe on` in the folder. The agent adds the vibe section. |
