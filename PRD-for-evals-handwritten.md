# Evaluations

I want to add evaluations. The motivation is to steer development based on data.

## Evaluations Framework

- At the start, find all files in a given directory whose filenames end with .eval.ts. Run these dynamically as evals.

- Eval interface:

  describe("Basic arithmetic", () => {
  task("1+1", input: ..., task: (input) => {
  ...
  }, scorer: ..., options: {model: 'haiku', })
  } )

- Scorer interface:

<TInput, TOutput, TExpected = TOutput>(props: {input: TInput, output: TOutput, expect: TExpexted}) : number | {score: number, metadata?: Record<string, unknown>}

- At the end, show a summary:
  - scenarios and their scores and cost
  - Total score and total cost
- Write eval results to JSON file to enable visualization over time.
- Abstract Scorer interface.
- Enable different scorer types:
  - Deterministic
  - LLM as a judge
- beforeEach and afterEach
- beforeAll - required for runInSandbox
- Track the costs, for agent and for the LLM judge. Show them in the summary.
- Display metadata along the result.
- Summary example:
  Basic Arithmetic > 1 + 1: 100% in 7.2s - { tokens: 534, cost: "$1.24"}
  Total: 73% in 1min 27s - { cost: "$4" }

## Framework specific to the Agent Coder

- Run evals against real Claude API
- Model configurable per eval
- Scoring based on work directory and agentSession
- beforeAll: Run eval program using runInSandbox, create a temp dir for the run.
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
