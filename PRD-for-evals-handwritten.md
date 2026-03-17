# Evaluations

I want to add evaluations. The motivation is to steer development based on data.

## Framework specific to the Agent Coder

- ✅ Run evalite program using srt CLI,
- Run evals against real Claude API
- Model configurable per eval
- Scoring based on work directory and agentSession
- Create a temp dir for the run.
- beforeEach: create dir for the scenario, copy files, run agentRequest, score the result.
- afterAll: Print temp dir to the console, for inspection
- tokens can be returned in the scorer metadata
- Tool calls can be returned in the scorer metadata

## Scenarios to get started with

- Basic arithmetic: Ask agent what 1 + 2 is - deterministic judge
- Tool calling: Ask agent to Write "Hello" into a new file named `newfile.md` - score 1 if file created with correct content, otherwise 0
- Multi tool calling: Ask agent to read file `existingfile.md` and capitalize all words - score 1 if file updated with correct content, otherwise 0
- Code understanding: Make ts file with a fibonacci function, but call it X. Ask the agent what X does. Score 1 if fibonacci, otherwise 0
- Debugging: Write a ts file with bug. Ask the agent to fix it. Ask LLM-as-a-judge if it is fixed.
- Planning: Ask agent to make a plan for building a new bun project that build a CLI for scoring bowling games, with the inputs given via stdin. Use LLM-as-a-judge to score.

## Plan

### How do I load the eval files?

Do I even the fancy syntax? I can probably avoid dynamic loading.

##
