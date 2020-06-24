const child_process = require('child_process')
const { checkPython3, com } = require("./utils.js")
module.exports = async function ({ exercise, socket, action }) {
    if(!exercise || exercise.language != "python") console.log('Ignoring hook')

    const _ = com(socket)
    if(!checkPython3()) _.error(`You need to have python3 installed to run test the exercises`)
    if( !exercise.files || exercise.files.length == 0) _.error(`No files to process`)
    if(typeof action !== "string") _.error("Missing action property on hook details")
    
    const execute = require(`./actions/${action}.js`)

    _.log('compiling',['Compiling...']);
    execute({ exercise, socket })
        .then(stdout => {
            _.clean()
            _.success(stdout)
        })
        .catch(error => {
            _.error(error)
        })
}