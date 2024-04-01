const fs = require('fs');
const path = require('path');
const { node } = require('compile-run');
const { Utils, CompilationError } = require('learnpack/plugin');
const  { getPrompts } = require("./utils");

module.exports = {
  validate: () => true,
  run: async function ({ exercise, socket }) {

    try{
      let entryPath = exercise.files.map(f => './'+f.path).find(f => f.includes(exercise.entry || 'app.js'));
      if(!entryPath) throw new Error("No entry file, maybe you need to create an app.js file on the exercise folder?");
      
      const content = fs.readFileSync(entryPath, "utf8");
      const promptsValues = getPrompts(content);
      
      const inputs = (promptsValues.length === 0) ? [] : await socket.ask(promptsValues);
      
      const header = fs.readFileSync(path.resolve(__dirname,'./utils/prepend.compile.js'), "utf8");

      const data = {
        starting_at: Date.now(),
        source_code: content,
      }
      let result = await node.runSource(`${header} ${content}`, { stdin: inputs.join('\n') })
      data.ended_at = Date.now();
      result.stdout = Utils.cleanStdout(result.stdout, promptsValues);
      result = { ...result, ...data }
      // if(result.exitCode > 0) throw CompilationError(result.stderr);
      return result
    }
    catch(e){
      throw CompilationError(e.message || e.msg);
    }
    
  },
}
  