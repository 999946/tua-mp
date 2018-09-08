import {log} from './utils/index'
import {version} from '../package.json'

import TuaComp from './TuaComp'
import TuaPage from './TuaPage'

log(`Version ${version}`)

export {
  TuaComp,
  TuaPage,
}

export default function ({type = 'page', ...rest}) {
  return type === 'page' ? TuaPage(rest) : TuaComp(rest)
}
