const acorn = require("acorn")
const walk = require("acorn-walk")

const getPrompts = (content) => {
  const inputs = [];

  walk.full(acorn.parse(content), (node) => {
    if (node.type === "CallExpression") {
      if (node.callee.name === "prompt") {
        inputs.push(node.arguments.map((a) => a.value))
      }
    }
  });

  return inputs.flat()
};

module.exports = { getPrompts }