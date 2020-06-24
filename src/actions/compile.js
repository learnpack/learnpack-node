const fs = require('fs');

const { python } = require('compile-run');
const { getMatches, cleanStdout } = require('../utils.js');

module.exports = async function ({ exercise, socket }) {

  let entryPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('app.py') > -1);
  if(!entryPath) throw new Error("No app.py entry file");

  const content = fs.readFileSync(entryPath, "utf8");
  const count = getMatches(/input\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content);
  let inputs = (count.length == 0) ? [] : await socket.ask(count);

  const result = await python.runFile(entryPath, { stdin: inputs.join('\n'), executionPath: 'python3' })
  if(result.exitCode > 0) throw Error(result.stderr);
  return cleanStdout(result.stdout, count)
}
  