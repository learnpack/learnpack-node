const fs = require('fs');
const path = require('path');
const { node } = require('compile-run');
const { Utils, CompilationError } = require('./utils/index.js');

module.exports = {
  validate: () => true,
  run: async function ({ exercise, socket }) {

    let entryPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('app.js') > -1);
    if(!entryPath) throw new Error("No app.js entry file");

    const content = fs.readFileSync(entryPath, "utf8");
    const count = Utils.getMatches(/^([^\/])+prompt\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content);
    const inputs = (count.length == 0) ? [] : await socket.ask(count);

    const header = fs.readFileSync(path.resolve(__dirname,'./_prepend.compile.js'), "utf8");

    const result = await node.runSource(`${header} ${content}`, { stdin: inputs.join('\n') })
    if(result.exitCode > 0) throw CompilationError(result.stderr);
    return Utils.cleanStdout(result.stdout, count)
    
  },
}
  