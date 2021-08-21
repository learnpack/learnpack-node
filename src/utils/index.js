const acorn = require("acorn");
const walk = require("acorn-walk");
const readline = require("readline");

const getPrompts = (content) => {
  const inputs = [];

  walk.full(acorn.parse(content, { ecmaVersion: 2020 }), (node) => {
    if (node.type === "CallExpression") {
      if (node.callee.name === "prompt") {
        inputs.push(node.arguments.map((a) => a.value));
      }
    }
  });

  return inputs.flat();
};

// Used to ask by console
const askInCommandLine = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(`${question} `, (line) => {
      resolve(line);
      rl.close();
    });
  });
};

module.exports = { getPrompts, askInCommandLine };
