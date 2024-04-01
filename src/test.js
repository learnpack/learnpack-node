const fs = require('fs')
const path = require('path')
const chalk = require("chalk")
const shell = require('shelljs')
const transformer = require.resolve('./utils/babelTransformer')
const { TestingError } = require('learnpack/plugin')
const { getPrompts } = require("./utils");

let nodeModulesPath = path.dirname(require.resolve('jest'))
nodeModulesPath = nodeModulesPath.substr(0, nodeModulesPath.indexOf("node_modules")) + "node_modules/"

module.exports = {
  validate: async function ({ exercise, configuration }) {

    if (!shell.which('jest')) {
      const packageName = "jest@24.8.0";
      throw TestingError(`🚫 You need to have ${packageName} installed to run test the exercises, run $ npm i ${packageName} -g`);
    }

    return true
  },
  run: async ({ exercise, socket, configuration }) => {

    let jestConfig = {
      verbose: true,
      moduleDirectories: [path.resolve(nodeModulesPath)],
      transform: {
        "^.+\\.js?$": transformer
      },
      globalSetup: path.resolve(__dirname, './utils/prepend.test.js')
    }

    const getEntry = () => {

      let testsPath = exercise.files.map(f => f.path).find(f => f.includes('test.js') || f.includes('tests.js'));
      if (!fs.existsSync(testsPath)) throw TestingError(`🚫 No test script found on the exercise files`);

      return testsPath;
    }

    const getContent = () => {
      const appPath = exercise.files.map(f => './' + f.path).find(f => f.includes(exercise.entry || 'app.js'));
      if (!fs.existsSync(appPath)) return ""
      return fs.readFileSync(appPath, "utf8");
    }

    const getCommands = async function () {

      const appPath = exercise.files.map(f => './' + f.path).find(f => f.includes(exercise.entry || 'app.js'));
      let answers = []
      if (appPath) {
        const content = fs.readFileSync(appPath, "utf8");
        const promptsValues = getPrompts(content);
        answers = (promptsValues.length === 0) ? [] : await socket.ask(promptsValues);
      }

      jestConfig.reporters = [[path.resolve(__dirname + '/utils/reporter.js'), { reportPath: path.resolve(`${configuration.dirPath}/reports/${exercise.slug}.json`) }]];

      return `jest --config='${JSON.stringify({ ...jestConfig, globals: { __stdin: answers }, testRegex: getEntry() })}' --colors`
    }

    const getStdout = (rawStdout) => {
      let _stdout = [];
      if (fs.existsSync(`${configuration.dirPath}/reports/${exercise.slug}.json`)) {
        const _text = fs.readFileSync(`${configuration.dirPath}/reports/${exercise.slug}.json`);
        const errors = JSON.parse(_text);

        _stdout = errors.testResults.map(r => r.message);

        if (errors.failed.length > 0) {
          msg = `\n\n   ${'Your code must to comply with the following tests:'.red} \n\n${[...new Set(errors.failed)].map((e, i) => `     ${e.status !== 'failed' ? chalk.green.bold('✓ (done)') : chalk.red.bold('x (fail)')} ${i}. ${chalk.white(e.title)}`).join('\n')} \n\n`;
          _stdout.push(msg);
        }
      }
      else throw TestingError("Could not find the error report for " + exercise.slug);
      return _stdout
    }

    let commands = await getCommands()
    if (!Array.isArray(commands)) commands = [commands]

    let appContent = getContent()
    const result = {
      starting_at: Date.now(),
      source_code: appContent,
    }

    let stdout, stderr, code = [null, null, null]
    for (let cycle = 0; cycle < commands.length; cycle++) {
      let resp = shell.exec(commands[cycle], { silent: true })
      stdout = resp.stdout
      code = resp.code
      stderr = resp.stderr
      if (code != 0) break
    }

    result.ended_at = Date.now();
    result.exitCode = code
    result.stdout = stdout
    result.stderr = stderr

    if (code != 0) {
      result.stderr = getStdout(stdout || stderr).join()
    }
    chalk.green("✔ All tests have passed")
    return result
  }
}