const { plugin } = require("learnpack/plugin")

module.exports = plugin({
    language: "node",
    compile: require('./compile'),
    test: require('./test'),
})