const { plugin } = require("./utils/index")

module.exports = plugin({
    language: "node",
    compile: require('./compile'),
    test: require('./test'),
})