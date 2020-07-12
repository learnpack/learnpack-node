const { plugin } = require("./utils/index")

module.exports = plugin({
    language: "python3",
    compile: require('./compile'),
    test: require('./test'),
})