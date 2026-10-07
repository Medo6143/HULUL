const LINE = /(?:^|[\s"'`])((?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)-[\w[\]/.%:-]+)/;
const BARE = /(?:^|[\s"'`])(text-left|text-right|float-left|float-right)(?=$|[\s"'`])/;
const CSS = /(?:^|[;{}])\s*(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/;
const CAMEL = /\b(marginLeft|marginRight|paddingLeft|paddingRight)\b/;

function findPhysical(line) {
  return line.match(LINE)?.[1] ?? line.match(BARE)?.[1] ?? line.match(CSS)?.[1] ?? line.match(CAMEL)?.[1] ?? null;
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow physical left/right styles. Use logical properties.",
    },
    schema: [],
    messages: {
      physical:
        "Physical direction '{{match}}' is not allowed. Use logical properties (ms, me, ps, pe, start, end).",
    },
  },
  create(context) {
    return {
      Program(node) {
        const lines = context.sourceCode.getText().split(/\r?\n/);
        lines.forEach((line, index) => {
          if (line.includes("physical-direction-ok")) return;
          const match = findPhysical(line);
          if (!match) return;
          context.report({
            node,
            loc: {
              start: { line: index + 1, column: 0 },
              end: { line: index + 1, column: line.length },
            },
            messageId: "physical",
            data: { match },
          });
        });
      },
    };
  },
};

export default rule;
