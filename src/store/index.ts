import { store } from 'quasar/wrappers'
import Vuex from 'vuex'

import guitarAudio from './guitar-audio'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export interface StoreInterface {
  example: unknown;
}

export default store(function ({ Vue }) {
  Vue.use(Vuex)

  const Store = new Vuex.Store({
    modules: {
      guitarAudio
    },

    // enable strict mode (adds overhead!)
    // for dev mode only
    strict: !!process.env.DEV
  })

  return Store
})
