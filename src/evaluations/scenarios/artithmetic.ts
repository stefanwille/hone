interface Task<TInput, TOutput, TExpected = TOutput> {
  name: string;
  run: (input: TInput) => Promise<TOutput>;
  expected: TExpected;
  scorer: (props: {
    input: TInput;
    output: TOutput;
    expected: TExpected;
  }) => Promise<number>;
}

interface Evaluation<TInput, TOutput, TExpected = TOutput> {
  name: string;
  tasks: Task<TInput, TOutput, TExpected>[];
}

class Evaluations {
  private evaluations: Evaluation<unknown, unknown, unknown>[] = [];

  addEvaluation(evaluation: Evaluation<unknown, unknown, unknown>) {
    this.evaluations.push(evaluation);
  }

  getEvaluations() {
    return this.evaluations;
  }
}

let evaluations: Evaluations;

interface Describe {
  name: string;
  body: DescribeBody;
}

class Describes {
  private describes: Describe[] = [];

  addDescribe(describe_: Describe) {
    this.describes.push(describe_);
  }
}

const describes = new Describes();

type DescribeBody = () => void;

function describe(name: string, describeBody: DescribeBody) {
  describes.addDescribe({ name, body: describeBody });
}

describe("Basic arithmetic", () => {
  console.log("Basic arithmetic");
});

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
