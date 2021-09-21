const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const shell = require("shelljs");
const transformer = require.resolve("./utils/babelTransformer");
const { TestingError } = require("learnpack/plugin");

let nodeModulesPath = path.dirname(require.resolve("jest"));
nodeModulesPath =
  nodeModulesPath.substr(0, nodeModulesPath.indexOf("node_modules")) +
  "node_modules/";

  console.log(nodeModulesPath);
  
module.exports = {
  validate: async function ({ exercise, configuration }) {
    if (!shell.which("jest")) {
      const packageName = "jest@24.8.0";
      throw TestingError(
        `🚫 You need to have ${packageName} installed to run test the exercises, run $ npm i ${packageName} -g`
      );
    }

    return true;
  },
  run: async ({ exercise, socket, configuration }) => {
    let jestConfig = {
      verbose: true,
      moduleDirectories: [nodeModulesPath],
      transform: {
        "^.+\\.js?$": transformer,
      },
    };

    const getEntry = () => {
      let testsPath = exercise.files
        .map((f) => f.path)
        .find((f) => f.includes("test.js") || f.includes("tests.js"));
      if (!fs.existsSync(testsPath))
        throw TestingError(`🚫 No test script found on the exercise files`);

      return testsPath;
    };

    const getCommands = async function () {
      jestConfig.reporters = [
        [
          __dirname + "/utils/reporter.js",
          {
            reportPath: `${configuration.dirPath}/reports/${exercise.slug}.json`,
          },
        ],
      ];

      return `jest --config '${JSON.stringify({
        ...jestConfig,
        testRegex: getEntry(),
      })}' --colors`;
    };

    const getStdout = (rawStdout) => {
      let _stdout = [];
      if (
        fs.existsSync(`${configuration.dirPath}/reports/${exercise.slug}.json`)
      ) {
        const _text = fs.readFileSync(
          `${configuration.dirPath}/reports/${exercise.slug}.json`
        );
        const errors = JSON.parse(_text);

        _stdout = errors.testResults.map((r) => r.message);

        if (errors.failed.length > 0) {
          msg = `\n\n   ${
            "Your code must to comply with the following tests:".red
          } \n\n${[...new Set(errors.failed)]
            .map(
              (e, i) =>
                `     ${
                  e.status !== "failed"
                    ? chalk.green.bold("✓ (done)")
                    : chalk.red.bold("x (fail)")
                } ${i}. ${chalk.white(e.title)}`
            )
            .join("\n")} \n\n`;
          _stdout.push(msg);
        }
      } else
        throw TestingError(
          "Could not find the error report for " + exercise.slug
        );
      return _stdout;
    };

    let commands = await getCommands();

    if (!Array.isArray(commands)) commands = [commands];
    let stdout,
      stderr,
      code = [null, null, null];
    for (let cycle = 0; cycle < commands.length; cycle++) {
      let resp = shell.exec(commands[cycle], { silent: true });
      stdout = resp.stdout;
      code = resp.code;
      stderr = resp.stderr;
      if (code != 0) break;
    }

    if (code != 0) throw TestingError(getStdout(stdout || stderr).join());
    else
      return stdout && stdout.length > 0
        ? stdout
        : chalk.green("✔ All tests have passed");
  },
};
