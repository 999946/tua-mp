import {TuaPage} from '../../utils/tua-mp'
import {formatTime} from '../../utils/index'

TuaPage({
  data: {
    logs: [],
  },

  beforeCreate() {
    console.log('logs lifecycle -----beforeCreate')
  },
  created() {
    console.log('logs lifecycle -----created')
    this.interval = setInterval(() => {
      console.log('---------')
    }, 1000)

    const logs = wx.getStorageSync('logs') || []

    this.logs = logs
      .map(log => new Date(log))
      .map(formatTime)
  },
  beforeMount() {
    console.log('logs lifecycle -----beforeMount')
  },
  mounted() {
    console.log('logs lifecycle -----mounted')
  },
  beforeUpdate() {
    console.log('logs lifecycle -----beforeUpdate')
  },
  updated() {
    console.log('logs lifecycle -----updated')
  },
  activated() {
    console.log('logs lifecycle -----activated')
  },
  deactivated() {
    console.log('logs lifecycle -----deactivated')
  },
  beforeDestroy() {
    clearInterval(this.interval)
    console.log('logs lifecycle -----beforeDestroy')
  },
  destroyed() {
    console.log('logs lifecycle -----destroyed')
  },

  onLoad() {
    console.log('logs lifecycle -----onLoad')
    // const logs = wx.getStorageSync('logs') || []
    //
    // this.logs = logs
    //   .map(log => new Date(log))
    //   .map(formatTime)
  },
  onShow() {
    console.log('logs lifecycle -----onShow')
  },
  onReady() {
    console.log('logs lifecycle -----onReady')
  },
  onHide() {
    console.log('logs lifecycle -----onHide')
  },
  onUnload() {
    console.log('logs lifecycle -----onUnload')
  },
  methods: {
    gotoTest() {
      wx.navigateTo({
        url: '/pages/test/test'
      })
    },
  },
})
