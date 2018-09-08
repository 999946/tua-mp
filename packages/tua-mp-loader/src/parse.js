

function getImportsMapFormMetadata(metadata) {
  let {importsMap} = metadata
  const {imports} = metadata.modules

  if (!importsMap) {
    importsMap = {}
    imports.forEach(m => {
      m.specifiers.forEach(v => {
        importsMap[v.local] = m.source
      })
    })
    metadata.importsMap = importsMap
  }

  return metadata
}

function parseComponentsDeps() {
  return {
    visitor: {
      ExportDefaultDeclaration: function (path) {
        path.traverse({
          Property: function (path) {
            if (path.node.key.name !== 'components') {
              return
            }
            path.stop()

            const {metadata} = path.hub.file
            const {importsMap} = getImportsMapFormMetadata(metadata)

            // 找到所有的 imports
            const {properties} = path.node.value
            const components = {}
            properties.forEach(p => {
              const k = p.key.name || p.key.value
              const v = p.value.name || p.value.value

              components[k] = importsMap[v]
            })

            metadata.components = components
          }
        })
      }
    }
  }
}

function parseGlobalComponents() {
  return {
    visitor: {
      CallExpression(path) {
        const {callee, arguments: args} = path.node
        const {metadata} = path.hub.file
        if (!callee.object || !callee.property) {
          return
        }
        if (callee.object.name === 'Vue' && callee.property.name === 'component') {
          if (!args[0] || args[0].type !== 'StringLiteral') {
            throw new Error('Vue.component()的第一个参数必须为静态字符串')
          }
          if (!args[1]) {
            throw new Error('Vue.component()需要两个参数')
          }
          const {importsMap} = getImportsMapFormMetadata(metadata)
          globalComponents[args[0].value] = importsMap[args[1].name]
        }
        metadata.globalComponents = globalComponents
      }
    }
  }
}

export { getImportsMapFormMetadata, parseComponentsDeps, parseGlobalComponents }