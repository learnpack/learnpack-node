const fs = require('fs')

const TestingError = (messages) => {
    const _err = new Error(messages)
    _err.status = 400
    _err.stdout = messages
    _err.type = 'testing-error'
    return _err
}

module.exports = {
  TestingError,
  default: async function(args){
    const { action, configuration, slug } = args;

    if (!fs.existsSync(`${configuration.configPath.base}/reports`)){
      // reports directory
      fs.mkdirSync(`${configuration.configPath.base}/reports`);
    }

    const stdout = await action.run(args)

    configuration.exercises = configuration.exercises.map(e => {
      if(e.slug === slug) e.done = true;
      return e;
    });

    return stdout
  }
}