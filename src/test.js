const fs = require('fs')
const chalk = require("chalk")
const shell = require('shelljs')
const { Utils, TestingError } = require('./utils/index.js')

module.exports =  {
  validate: async function({ exercise, configuration }){

    if (!shell.which('pytest')) {
      throw Error(`🚫 You need to have pytest, pytest-testdox and mock installed to run test the exercises, run $ pip3 install pytest pytest-testdox mock`);
    }

    let venvPythonPath = null
    if (fs.existsSync("./.venv/lib/") ) {
      const pythons = fs.readdirSync('./.venv/lib/')
      if(pythons.length > 0) venvPythonPath = "./.venv/lib/"+pythons[0]
    }
    //i have to create this conftest.py configuration for pytest, to allow passing the inputs as a parameter
    fs.writeFileSync("./conftest.py", `import sys, os, json
if os.path.isdir("./.venv/lib/"):
    sys.path.append('${venvPythonPath}/site-packages')
def pytest_addoption(parser):
    parser.addoption("--stdin", action="append", default=[],
        help="json with the stdin to pass to test functions")
def pytest_generate_tests(metafunc):
    if 'stdin' in metafunc.fixturenames:
        metafunc.parametrize("stdin",metafunc.configuration.getoption('stdin'))
    if 'app' in metafunc.fixturenames:
        try:
          sys.path.append('${configuration.outputPath}')
          import cached_app
          metafunc.parametrize("app",[cached_app.execute_app])
        except SyntaxError:
          metafunc.parametrize("app",[lambda : None])
        except ImportError:
          metafunc.parametrize("app",[cached_app])
        except AttributeError:
          metafunc.parametrize("app",[cached_app])
    if 'configuration' in metafunc.fixturenames:
        metafunc.parametrize("configuration", [json.loads('${JSON.stringify(configuration)}')])
`)

    return true
  },
  run: async ({ exercise, socket, configuration }) => {

    const getEntry = () => {
      console.log(exercise);
      let entryPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('test.py') > -1 || f.indexOf('tests.py') > -1)
      if (!fs.existsSync(entryPath)) throw TestingError(`🚫 No tests.py script found on the exercise in ${entryPath}`)
  
      const appPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('app.py') > -1)
      if (fs.existsSync(appPath)){
        let content = fs.readFileSync(appPath, "utf8")
        const count = Utils.getMatches(/def\s[a-zA-Z]/gm, content)
  
        if(count.length == 0){
          // Adding main execute_app function for all the code
          content = `def execute_app():\n${Utils.indent(content, 4)}`
        }
        const directory = `${configuration.outputPath}/cached_app.py`
        fs.writeFileSync(directory, content)
      }
      else if(configuration.grading === "isolated") throw TestingError(`🚫 No app.py script found on the exercise files`)
  
      return entryPath
    }

    const getCommands = async function(){

      const appPath = exercise.files.map(f => './'+f.path).find(f => f.indexOf('app.py') > -1)
      if(appPath !== undefined){
        const content = fs.readFileSync(appPath, "utf8")
        const count = Utils.getMatches(/input\((?:["'`]{1}(.*)["'`]{1})?\)/gm, content)
        let answers = (count.length == 0) ? [] : await socket.ask(count)

        return `pytest ${getEntry()} --testdox --capture=sys --color=yes --stdin='${JSON.stringify(answers)}'`
      }
      else{
        return `pytest ${getEntry()} --testdox --capture=sys --color=yes`
      }
    }

    const getStdout = (rawStdout) => {
      //@pytest.mark.it('1. Your code needs to print Yellow on the console')
      var regex = /@pytest\.mark\.it\(["'](.+)["']\)/gm
      let errors = []
      let found = null
      while ((found = regex.exec(rawStdout)) !== null){
        if (found.index === regex.lastIndex) {
            regex.lastIndex++
        }
        errors.push({ title: found[1], status: 'failed' })
      }

      let _stdout = [rawStdout]
      if(errors.length > 0){
        msg = `\n\n   
          ${chalk.red('Your code must to comply with the following tests:')} \n\n
          ${[...new Set(errors)].map((e,i) => `     ${e.status !== 'failed' ? chalk.green.bold('✓ (done)') : chalk.red.bold('x (fail)')} ${i}. ${chalk.white(e.title)}`).join('\n')} \n\n`
        _stdout.push(msg)
      }
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