const babel = require('babel-core')

function parseScript(script, options) {
    console.log('script', script)
    console.log('options', options)

    let result, metadata
    let scriptContent = script.content
    if (script.src) { // 处理src
        const scriptpath = path.join(path.dirname(resourcePath), script.src)
        scriptContent = fs.readFileSync(scriptpath).toString()
    }

    result = babel.transform(scriptContent, {plugins: [parseComponentsDeps]})

    const { importsMap, components: originComponents } = metadata

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
}

// 针对 .vue 单文件的脚本逻辑的处理
// 处理出当前单文件组件的子组件依赖
function compileMPScript (script, mpOptioins, moduleId) {
    const { resourcePath, options, resolve, context } = this
    const babelrc = getBabelrc(mpOptioins.globalBabelrc)
    let result, metadata
    let scriptContent = script.content
    const babelOptions = { extends: babelrc, plugins: [parseComponentsDeps] }
    if (script.src) { // 处理src
        const scriptpath = path.join(path.dirname(resourcePath), script.src)
        scriptContent = fs.readFileSync(scriptpath).toString()
    }
    if (script.lang === 'ts') { // 处理ts
        metadata = parseComponentsDepsTs(scriptContent)
    } else {
        result = babel.transform(scriptContent, babelOptions)
        metadata = result.metadata
    }

    // metadata: importsMap, components
    const { importsMap, components: originComponents } = metadata

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
}

// checkMPEntry 针对 entry main.js 的入口处理
// 编译出 app, page 的入口js/wxml/json

let globalComponents
function compileMP (content, mpOptioins) {
    const { resourcePath, emitFile, resolve, context, options } = this

    const fileInfo = resolveTarget(resourcePath, options.entry)
    cacheFileInfo(resourcePath, fileInfo)
    const { isApp, isPage } = fileInfo
    if (isApp) {
        // 解析前将可能存在的全局组件清空
        clearGlobalComponents()
    }

    const babelrc = getBabelrc(mpOptioins.globalBabelrc)
    // app入口进行全局component解析
    const { metadata } = babel.transform(content, { extends: babelrc, plugins: isApp ? [parseConfig, parseGlobalComponents] : [parseConfig] })

    // metadata: config
    const { rootComponent, globalComponents: globalComps } = metadata

    if (isApp) {
        // 保存旧数据，用于对比
        const oldGlobalComponents = globalComponents
        // 开始解析组件路径时把全局组件清空，解析完成后再进行赋值，标志全局组件解析完成
        globalComponents = null

        // 解析全局组件的路径
        const components = {}
        resolveSrc(globalComps, components, resolve, context, options.context).then(() => {
            handleResult(components)
        }).catch(err => {
            console.error(err)
            handleResult(components)
        })
        const handleResult = components => {
            globalComponents = components
            // 热更时，如果全局组件更新，需要重新生成所有的wxml
            if (oldGlobalComponents && !deepEqual(oldGlobalComponents, globalComponents)) {
                // 更新所有页面的组件
                Object.keys(cacheResolveComponents).forEach(k => {
                    resolveComponent(...cacheResolveComponents[k])
                })
                // 重新生成所有wxml
                Object.keys(cacheCreateWxmlFns).forEach(k => {
                    createWxml(...cacheCreateWxmlFns[k])
                })
            }
        }
    }

    if (isApp || isPage) {
        // 这儿应该异步在所有的模块都清晰后再生成
        // 生成入口 wxml
        if (isPage && rootComponent) {
            resolve(context, rootComponent, (err, rootComponentSrc) => {
                if (err) return
                // 这儿需要搞定 根组件的 路径
                createAppWxml(emitFile, resourcePath, rootComponentSrc, this.options.context)
            })
        }
    }

    return content
}

function resolveSrc (originComponents, components, resolveFn, context, projectRoot) {
    return Promise.all(Object.keys(originComponents).map(k => {
        return new Promise((resolve, reject) => {
            resolveFn(context, originComponents[k], (err, realSrc) => {
                if (err) return reject(err)
                const com = covertCCVar(k)
                const { filePath, name } = getCompNameAndSrc(projectRoot, realSrc)
                components[com] = { src: filePath, name }
                resolve()
            })
        })
    }))
}

const cacheResolveComponents = {}
function resolveComponent (resourcePath, fileInfo, importsMap, localComponents, moduleId) {
    // 需要等待全局组件解析完成
    if (!globalComponents) {
        setTimeout(resolveComponent, 20, ...arguments)
    } else {
        // 保存当前所有参数，在热更时如果全局组件发生变化，需要进行组件更新
        cacheResolveComponents[resourcePath] = arguments
        const components = Object.assign({}, globalComponents, localComponents)
        components.isCompleted = true
        cacheFileInfo(resourcePath, fileInfo, { importsMap, components, moduleId })
    }
}