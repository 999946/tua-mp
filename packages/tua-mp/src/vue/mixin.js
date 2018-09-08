import { LIFECYCLE_HOOKS } from './shared/constants'
import { mergeOptions } from './options';
import {
  isFn
} from '../utils/index'

export default (options) => {
  console.log('args options -- > ', options);
  options = mergeOptions(Object.create(null), options)
  console.log('mergeOptions options -- > ', options);
  delete options.mixins
  delete options.extends

  LIFECYCLE_HOOKS.forEach(v => {
    if(!isFn(options[v]) && Array.isArray(options[v])) {
      // console.log('options[v]',v, options[v])
      options['$' + v] = options[v]
      options[v] = function(...args) {
        options['$' + v].forEach(F => F.apply(this, args))
      }
    }
  })
  options.data = isFn(options.data) ? options.data() : options.data;
  // if(isFn(options.data)) {
  //   console.log('data', options.data())
  // }
  console.log('return options -- > ', options,  isFn(options.data), '\n\n');
  return options;
}