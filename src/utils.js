const { execSync } = require('child_process');

const checkPython3 = () => {
    try {
        let result = execSync('python -c "import platform; print(platform.python_version())"').toString()
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

module.exports = { checkPython3 }