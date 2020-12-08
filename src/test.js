const fs = require('fs')
const babelJest = require('babel-jest');
const path = require('path');
const chalk = require("chalk")
const shell = require('shelljs')
const nodeModulesPath = path.resolve(__dirname, '../node_modules');
const { TestingError } = require('./utils/index.js')

const transformer = babelJest.createTransformer({
  presets: [ nodeModulesPath+'/@babel/preset-env' ],
  babelrc: false,
  configFile: false,
});

module.exports =  {
  validate: async function({ exercise, configuration }){

    if (!shell.which('jest')) {
      const packageName = "jest@24.8.0";
      throw TestingError(`🚫 You need to have ${packageName} installed to run test the exercises, run $ npm i ${packageName} -g`);
    }

    return true
  },
  run: async ({ exercise, socket, configuration }) => {

    let jestConfig = {
      verbose: true,
      moduleDirectories: [nodeModulesPath],
      transform: {
        "^.+\\.js?$": transformer
      },
      globalSetup: path.resolve(__dirname, './_prepend.test.js')
    }

    const getEntry = () => {

      let testsPath = files.map(f => f.path).find(f => f.indexOf('test.js') > -1 || f.indexOf('tests.js') > -1);
      if (!fs.existsSync(testsPath))  throw TestingError(`🚫 No test script found on the exercise files`);
  
      return testsPath;
    }

    const getCommands = async function(){

      const appPath = files.map(f => './'+f.path).find(f => f.indexOf('app.js') > -1);
      const content = fs.readFileSync(appPath, "utf8");
      const count = getMatches(/prompt\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content);
      let answers = (count.length == 0) ? [] : await socket.ask(count);

      jestConfig.reporters = [[ __dirname+'/_reporter.js', { reportPath: `${configuration.dirPath}/reports/${slug}.json` }]];
      return `jest --config '${JSON.stringify({ ...jestConfig, globals: { __stdin: answers }, testRegex: getEntry() })}' --colors`
    }

    const getStdout = (rawStdout) => {
      let _stdout = [];
      if (fs.existsSync(`${configuration.dirPath}/reports/${slug}.json`)){
        const _text = fs.readFileSync(`${configuration.dirPath}/reports/${slug}.json`);
        const errors = JSON.parse(_text);
  
        _stdout = errors.testResults.map(r => r.message);
  
        if(errors.failed.length > 0){
          msg = `\n\n   ${'Your code must to comply with the following tests:'.red} \n\n${[...new Set(errors.failed)].map((e,i) => `     ${e.status !== 'failed' ? chalk.green.bold('✓ (done)') : chalk.red.bold('x (fail)')} ${i}. ${chalk.white(e.title)}`).join('\n')} \n\n`;
          _stdout.push(msg);
        }
      }
      else throw TestingError("Could not find the error report for "+slug);
      return _stdout
    }

    let commands = await getCommands()
    if(!Array.isArray(commands)) commands = [commands]
    let stdout, stderr, code = [null, null, null]
    for(let cycle = 0; cycle < commands.length; cycle++){
      let resp = shell.exec(commands[cycle], { silent: true })
      stdout = resp.stdout
      code = resp.code
      stderr = resp.stderr
      if(code != 0) break
    }
    
    if(code != 0) throw TestingError(getStdout(stdout || stderr).join())
    else return stdout
  }
}