import loaderUtils from 'loader-utils';
import {parseGlobalComponents, parseComponentsDeps} from './parse'

module.exports = function (content) {
  const options = loaderUtils.getOptions(this) || {}
  this.cacheable && this.cacheable();
  try {
    console.log('script', script)
    console.log('options', options)

    let result, metadata
    let scriptContent = script.content
    if (script.src) { // 处理src
      const scriptpath = path.join(path.dirname(resourcePath), script.src)
      scriptContent = fs.readFileSync(scriptpath).toString()
    }

    result = babel.transform(scriptContent, {plugins: [parseGlobalComponents, parseComponentsDeps]})

    const {importsMap, components: originComponents, globalComponents} = result.metadata

    // 处理子组件的信息
    const components = {}
    const fileInfo = resolveTarget(resourcePath, options.entry)
    if (originComponents) {
      resolveSrc(originComponents, components, resolve, context, options.context).then(() => {
        resolveComponent(resourcePath, fileInfo, importsMap, components, moduleId)
      }).catch(err => {
        console.error(err)
        resolveComponent(resourcePath, fileInfo, importsMap, components, moduleId)
      })
    } else {
      resolveComponent(resourcePath, fileInfo, importsMap, components, moduleId)
    }

    return script
  } catch (err) {
    console.error(err)
    this.emitError(err);
    return null;
  }
};