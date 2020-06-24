const child_process = require('child_process')

module.exports = async function ({ exercise, socket, action }) {
    if(exercise.language != "python") console.log('Ignoring hook')

    if(!checkPython3()) throw CompilerError(`🚫 You need to have python3 installed to run test the exercises`);
    if( !files || files.length == 0) throw Error("No files process");

    if(typeof action !== "string") throw Error("Missing action property on hook details"); 
    const execute = require(`./actions/${action}.js`)
    execute(execute, socket)
}