const fs = require('fs');
const { python } = require('compile-run');
const { Utils, CompilationError } = require('./utils/index.js');
const { checkPython3 } = require('./utils.js');

module.exports = {
  validate: async () => {
    if(!checkPython3()) throw Error(`You need to have python3 installed to run test the exercises`)
    return true
  },
  run: async function ({ exercise, socket }) {
    
    let entryPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('app.py') > -1);
    if(!entryPath) throw new Error("No app.py entry file");

    const content = fs.readFileSync(entryPath, "utf8");
    const count = Utils.getMatches(/input\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content);
    let inputs = (count.length == 0) ? [] : await socket.ask(count);

    const result = await python.runFile(entryPath, { stdin: inputs.join('\n'), executionPath: 'python3' })
    if(result.exitCode > 0) throw CompilationError(result.stderr);
    return Utils.cleanStdout(result.stdout, count)
  },
}
  