import Tuna from 'tunajs';
import guitarStringsHelper from './GuitarStringsHelper';
import { StringsPinsHolder } from './models/GuitarStringsModels';

/**
 * 吉他弦控制
 */
class GuitarStringsCtrl {
  /**
   * 浏览器的采样频率
   */
  private sampleRate: number;

  /**
   * 弦号
   */
  private strings: number;

  /**
   * 是否静音
   */
  private muted = true;

  /**
   * 当前拨动的品
   */
  private pins = 0;

  /**
   * 当前震动的频率
   */
  private freq = 440;

  /**
   * 音频衰减
   */
  private audioDecay = 0.99;

  /**
   * 一个波动周期内，采样的个数
   */
  private streamLen = 0;

  /**
   * 音频流
   */
  private audioStream = new Float32Array();

  /**
   * 音频流是否初始化完成
   */
  private audioSteamInited = false;

  /**
   * 音频流游标
   */
  private streamPos = 0;

  /**
   * 当前的音频幅值
   */
  private audioCurrent = 0;

  /**
   * play后一段时间mute掉的监听器
   */
  private muteListner = 0;

  constructor(stringsIdx: number, sampleRate: number) {
    this.strings = stringsIdx;
    this.sampleRate = sampleRate;
    console.log(
      'Create Guitar Strings',
      stringsIdx,
      '| Sample Rate',
      sampleRate
    );
  }

  samplingFrequency(): number {
    if (this.muted) {
      return 0;
    }

    if (!this.audioSteamInited) {
      // 这里比较有意思，只需要生成一个周期的噪点，保证每个周期的噪点波形一致即可（什么原理？）
      // 两个随机数相减会比使用单一随机数效果好很多（什么原理？）
      this.audioStream[this.streamPos] =
        Math.sin((Math.random() - Math.random()) * Math.PI) * 50;
      // 生成一个周期的正弦波，加上噪点
      // this.audioStream[this.streamPos] =
      //   (Math.sin(Math.PI * 2 * (this.streamPos / this.streamLen)) +
      //   Math.random() / 4);
    }

    // 加入衰减
    this.audioCurrent = this.audioStream[this.streamPos] * this.audioDecay;
    this.audioStream[this.streamPos] = this.audioCurrent;

    this.streamPos++;
    if (this.streamPos >= this.streamLen) {
      this.audioSteamInited = true;
      this.streamPos = 0;
    }

    return this.audioCurrent;
  }

  play(pins: number) {
    this.pins = pins;
    const maHolder = guitarStringsHelper.getMaHolderByStringsAndPins(
      this.strings,
      this.pins
    );
    if (!maHolder || !maHolder.musicalAlphabet.freq) {
      return;
    }

    if (this.muteListner) {
      window.clearTimeout(this.muteListner);
      this.muteListner = 0;
    }

    // 计算freq
    this.freq = maHolder.musicalAlphabet.freq;
    // 计算在一个波动周期内，以当前的采样周期，需要采样多少个数值
    this.streamLen = Math.round(this.sampleRate / this.freq);
    // 重新生成音频流缓存
    this.audioStream = new Float32Array(this.streamLen);
    // 复位
    this.audioCurrent = 0;
    this.streamPos = 0;
    this.audioSteamInited = false;

    this.muteListner = window.setTimeout(() => (this.muted = true), 5000);

    this.muted = false;
  }

  mute() {
    console.log('mute strings: ', this.strings);
    this.muted = true;
  }

  isMuted(): boolean {
    return this.muted;
  }
}

/**
 * 创建一个音频输出，模拟吉他拨弦
 *
 * 1. 通过ScriptProcessor模拟吉他拨弦后的基频信号
 * 2. 经过tuna各种过滤器处理，在基频上增加各种泛音等处理，使得听起来更像是吉他
 * 3. 输出到设备音频输出
 *
 * scriptProcessor(×6) -> pre gain -> tuna filters -> post gain -> destination
 */
class GuitarStringsAudio {
  /**
   * 吉他音频输出
   */
  private guitarAudio(): { pre: GainNode; post: GainNode; acxt: AudioContext } {
    const acxt = new AudioContext();
    const tuna = new Tuna(acxt);

    // first gain
    const pre = acxt.createGain();
    pre.gain.value = 0.5;

    // last gain
    const post = acxt.createGain();
    post.gain.value = 1;

    // overdrive
    const drive = new tuna.Overdrive({
      outputGain: 0.5, // 0 to 1+
      drive: 0.1, // 0 to 1
      curveAmount: 0.6, // 0 to 1
      algorithmIndex: 2, // 0 to 5, selects one of the drive algorithms
      bypass: 1
    });

    // wahwah
    const wahwah = new tuna.WahWah({
      automode: false, // on/off
      baseFrequency: 0, // 0 to 1
      excursionOctaves: 1, // 1 to 6
      sweep: 0.2, // 0 to 1
      resonance: 2, // 1 to 100
      sensitivity: 0.3, // -1 to 1
      bypass: 0
    });

    // chorus
    const chorus = new tuna.Chorus({
      rate: 1.5, // 0.01 to 8+
      feedback: 0.1, // 0 to 1+
      delay: 0.0045, // 0 to 1
      bypass: 0
    });

    // cabinet
    const cabinet = new tuna.Cabinet({
      makeupGain: 1, // 0 to 20
      impulsePath: 'statics/impulses/impulse_guitar.wav', // path to your speaker impulse
      bypass: 0
    });

    // 将各种过滤器串联
    const filters = [pre, chorus, wahwah, drive, cabinet, post];
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    // 输出到扬声器
    post.connect(acxt.destination);

    return { pre, post, acxt };
  }

  /**
   * 吉他弦控制
   */
  private strings: Array<GuitarStringsCtrl>;

  /**
   * 用来控制输出增益/音量
   */
  private post: GainNode;

  /**
   * 构造函数
   */
  constructor() {
    // 创建吉他音频输出
    const { pre, post, acxt } = this.guitarAudio();
    this.post = post;

    // 每一弦均对应一个音源，将六根弦的音源链接到pre
    this.strings = Array.from([1, 2, 3, 4, 5, 6]).map((stringsIdx) => {
      // 创建一个音源控制脚本
      const scriptProcessor = acxt.createScriptProcessor(0, 0, 1);
      const strings = new GuitarStringsCtrl(stringsIdx, acxt.sampleRate);

      scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        // 输出的音频buffer
        const outputBuffer = event.outputBuffer.getChannelData(0);
        // 改写输出为吉他各弦基频信号采样值/幅值
        for (let i = 0; i < outputBuffer.length; i++) {
          outputBuffer[i] = strings.samplingFrequency();
        }
      };
      // 输入以上生成的特定频率音频
      scriptProcessor.connect(pre);

      return strings;
    });
  }

  /**
   * 拨动琴弦
   * @param stringsIds 弦 1~6
   * @param pins 品 0~14
   */
  play(stringsIdx: number, pins: number) {
    this.strings[stringsIdx - 1].play(pins);
    console.log('拨弦', `${stringsIdx}弦${pins}品`);
  }

  oneByOne(delay = 10, ...spHolders: StringsPinsHolder[]) {
    if (!spHolders || spHolders.length < 1) {
      return;
    }

    spHolders.forEach(({ strings, pins }, idx) => {
      window.setTimeout(
        () => this.strings[strings - 1].play(pins),
        idx * delay
      );
    });
  }

  decompose(...spHolders: StringsPinsHolder[]) {
    this.oneByOne(500, ...spHolders);
    console.log(
      '分解',
      spHolders
        .map((holder) => `${holder.strings}弦${holder.pins}品`)
        .join(' -> ')
    );
  }

  sweep(...spHolders: StringsPinsHolder[]) {
    this.oneByOne(10, ...spHolders);
    console.log(
      '扫弦',
      spHolders
        .map((holder) => `${holder.strings}弦${holder.pins}品`)
        .join(' -> ')
    );
  }

  /**
   * 静音弦音
   * @param strings 弦 1~6
   */
  mute(stringsIdx: number) {
    this.strings[stringsIdx - 1].mute();
  }

  /**
   * 静音所有弦音
   */
  muteAll() {
    this.strings.forEach((strs) => {
      strs.mute();
    });
  }

  /**
   * 获取当前音量
   */
  get gain(): number {
    return this.post.gain.value * 10;
  }

  /**
   * 设置音量
   */
  set gain(volumn: number) {
    if (volumn < 0 || volumn > 100) {
      return;
    }

    // 将音量 0~100 映射到增益 0~10
    this.post.gain.value = volumn / 10;
  }
}

export default new GuitarStringsAudio();
