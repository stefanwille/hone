import t from "bun:test";

/*

There will be no global beforeEach, afterEach, beforeAll, afterAll hooks. Except for the ones that are defined in the describe block.


 */

type Scorer<TInput, TOutput, TExpected = TOutput> = (props: {
  input: TInput;
  output: TOutput;
  expected: TExpected;
}) => Promise<number>;

interface Task<TInput, TOutput, TExpected = TOutput> {
  name: string;
  input: TInput;
  expected: TExpected;
  run: (input: TInput) => Promise<TOutput>;
  scorer: Scorer<TInput, TOutput, TExpected>;
  options?: Record<string, unknown>;
}

// interface Evaluation<TInput, TOutput, TExpected = TOutput> {
//   name: string;
//   tasks: Task<TInput, TOutput, TExpected>[];
// }

type BeforeEach = () => Promise<void>;
type AfterEach = () => Promise<void>;
type BeforeAll = () => Promise<void>;
type AfterAll = () => Promise<void>;

class Evaluations {
  private describes: Describe[] = [];
  private currentDescribe: Describe | null = null;

  // private evaluations: Evaluation<unknown, unknown, unknown>[] = [];

  addDescribe(describe_: Describe) {
    this.describes.push(describe_);
  }

  getDescribes() {
    return this.describes;
  }

  addTask(_task: Task<unknown, unknown, unknown>) {
    throw new Error("Method not implemented.");
  }

  // addEvaluation(evaluation: Evaluation<unknown, unknown, unknown>) {
  //   this.evaluations.push(evaluation);
  // }

  // getEvaluations() {
  //   return this.evaluations;
  // }

  async run() {
    for (const describe_ of this.describes) {
      describe_.body();
    }
  }
}

let evaluations: Evaluations = new Evaluations();

interface Describe {
  name: string;
  body: DescribeBody;
  tasks: Task<unknown, unknown, unknown>[];
}

type DescribeBody = () => void;

function describe(name: string, body: DescribeBody) {
  evaluations.addDescribe({ name, body, tasks: [] });
}

function task(task: Task<unknown, unknown, unknown>) {
  evaluations.addTask(task);
}

t.describe("evaluations", () => {
  t.beforeEach(() => {
    evaluations = new Evaluations();
  });
  t.describe("describe", () => {
    t.it("registers a new describe", () => {
      t.expect(evaluations.getDescribes().length).toBe(0);
      describe("Basic arithmetic", () => {});
      t.expect(evaluations.getDescribes().length).toBe(1);
    });
  });

  t.describe("running a describe", () => {
    t.it("registers its tasks", async () => {
      describe("Basic arithmetic", () => {
        task({
          name: "1+1",
          input: { question: "What is 1+1?" },
          run: (_input): Promise<string> => {
            return Promise.resolve("3");
          },
          expected: "2",
          scorer: () => Promise.resolve(1),
          options: { model: "haiku" },
        });
      });
      t.expect(evaluations.getDescribes().length).toBe(1);
      evaluations.run();
      const describe_ = evaluations.getDescribes()[0];
      t.expect(describe_!.tasks).toHaveLength(1);
    });
  });
});

// describe("Basic arithmetic", () => {
//   console.log("Basic arithmetic");
// });

// interface task {
//   name: string;
//   task: (input: any) => any;
//   expected: any;
//   scorer: (input: any) => any;
// }

// describe("Basic arithmetic",
//   [
//     {
//       name: "1+1",
//       task: (input: any) => {
//         return {
//           answer: "2",
//         }
//       },
//     }
//   ]
//   () => {

//   task("1+1", input: {question: "What is 1+1?", model: 'haiku'}, run: (input) => {
//     return {
//       answer: "2",
//     }
//   }, expected: "2", scorer: EquivalenceScorer, options: {model: 'haiku', })
// } )
