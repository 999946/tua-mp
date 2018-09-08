const { compile, compileToWxml } = require('./build')

module.exports = function (source) {
  this.cacheable && this.cacheable();
  try {
    console.log('111 source --- > '+ source);
    const compiled = compile(source, {})
    const output = compileToWxml(compiled, {})
    console.log('output code  --- > '+ output.code);
    return output.code;
  }
  catch (err) {
    console.error(err)
    this.emitError(err);
    return null;
  }
};