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
    let result = child_process.execSync('python -c "import platform; print(platform.python_version())"').toString()
    const python = result.split(".")

    if(python.length > 0 && '3' === python[0]) return true
    else{
      console.log("Python version: ",python)
      return true
    }
  } 
  catch (error) {
    return false
  }
}

const com = (_) => {
  return {
    error: msg => {
      _.log('internal-error', [ msg ])
      throw msg
    },
    clean: () => _.clean(),
    log: (...args) => _.log(...args),
    success: (stdout) => _.log('compiler-success', [ stdout ]),
  }
}

module.exports = { getMatches, cleanStdout, checkPython3, com };