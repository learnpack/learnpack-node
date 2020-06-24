const child_process = require('child_process');

const getMatches = (reg, content) => {
    let inputs = [];
    let m;
    while ((m = reg.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === reg.lastIndex) reg.lastIndex++;

        // The result can be accessed through the `m`-variable.
        inputs.push(m[1] || null);
    }
    return inputs;
}

const cleanStdout = (buffer, inputs) => {
  if(Array.isArray(inputs))
    for(let i = 0; i < inputs.length; i++)
      if(inputs[i]) buffer = buffer.replace(inputs[i],'');

  return buffer;
}

const checkPython3 = () => {
  try {
    let result = child_process.execSync('python -c "import platform; print(platform.python_version())"').toString();
    let { stdout } = result;
    if('3' === stdout.split(".")[0]) return true
  } 
  catch (error) {
    return false
  }
}

const dispatch = (action, message, status) => {
  const action = { action, message, status }
  await this.config.runHook('action', action)
}

module.exports = { getMatches, cleanStdout };