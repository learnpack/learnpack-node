const path = require('path');
const fs = require('fs');

const { python } = require('compile-run');
const { getMatches, cleanStdout } = require('./_utils.js');

module.exports = async function ({ execute, socket }) {

  let entryPath = files.map(f => './'+f.path).find(f => f.indexOf('app.py') > -1);
  if(!entryPath) throw new Error("No app.py entry file");

  socket.log('compiling',['Compiling...']);
  
  const content = fs.readFileSync(entryPath, "utf8");
  const count = getMatches(/input\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content);
  let inputs = (count.length == 0) ? [] : await socket.ask(count);

  const result = await python.runFile(entryPath, { stdin: inputs.join('\n'), executionPath: 'python3' })

  socket.clean();

  if(result.exitCode > 0) throw CompilerError(result.stderr);
  socket.log('compiler-success', [ cleanStdout(result.stdout, count) ]);
}
  