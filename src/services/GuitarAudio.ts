import Tuna from 'tunajs'

/**
 * 创建一个音频输出，模拟吉他拨弦
 */
class GuitarAudio {
  /**
   * 吉他音频输出
   * @param samplingFrequency 计算输出音频的采样
   */
  private guitarAudio (samplingFrequency: () => number) {
    const context = new AudioContext()
    const tuna = new Tuna(context)

    // first gain
    const pre = context.createGain()
    pre.gain.value = 0.5

    // last gain
    const post = context.createGain()
    post.gain.value = 1

    // overdrive
    const drive = new tuna.Overdrive({
      outputGain: 0.5, // 0 to 1+
      drive: 0.1, // 0 to 1
      curveAmount: 0.6, // 0 to 1
      algorithmIndex: 2, // 0 to 5, selects one of the drive algorithms
      bypass: 0
    })

    // wahwah
    const wahwah = new tuna.WahWah({
      automode: false, // on/off
      baseFrequency: 0.4, // 0 to 1
      excursionOctaves: 1, // 1 to 6
      sweep: 0.2, // 0 to 1
      resonance: 2, // 1 to 100
      sensitivity: 0.3, // -1 to 1
      bypass: 0
    })

    // chorus
    const chorus = new tuna.Chorus({
      rate: 1.5, // 0.01 to 8+
      feedback: 0.2, // 0 to 1+
      delay: 0.0045, // 0 to 1
      bypass: 0
    })

    // cabinet
    const cabinet = new tuna.Cabinet({
      makeupGain: 1, // 0 to 20
      impulsePath: 'statics/impulses/impulse_guitar.wav', // path to your speaker impulse
      bypass: 0
    })

    // tremolo
    const tremolo = new tuna.Tremolo({
      intensity: 0.2, // 0 to 1
      rate: 4, // 0.001 to 8
      stereoPhase: 2, // 0 to 180
      bypass: 0
    })

    // 将各种效果器串联
    const filters = [pre, chorus, wahwah, drive, cabinet, tremolo, post]
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1])
    }

    // 输出到扬声器
    post.connect(context.destination)

    // 创建一个音源控制脚本
    const scriptProcessor = context.createScriptProcessor(0, 0, 1)
    scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
      // 输出的音频
      const data = event.outputBuffer.getChannelData(0)
      // 改写输出的音频为吉他特定频率的采样
      for (let i = 0; i < data.length; i++) {
        data[i] = samplingFrequency()
      }
    }

    // 输入以上生成的特定频率音频
    scriptProcessor.connect(pre)
  }

  /**
   * 构造函数
   */
  constructor () {
    // 创建吉他音频输出
    this.guitarAudio(() => {
      return 0
    })
  }

  /**
   * 拨动琴弦
   * @param strings 弦 1~6
   * @param pins 品 1~12
   */
  play (strings: number, pins: number) {
    console.log(strings, pins)
  }

  /**
   * 停止弦音输出
   * @param strings 弦 1~6
   */
  stop (strings: number) {
    console.log(strings)
  }

  /**
   * 停止所有弦音输出
   */
  stopAll () {
    console.log('strop all')
  }
}

export default new GuitarAudio()
