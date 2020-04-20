import { MusicalAlphabetHolder } from './models/GuitarStringsModels';

/**
 * 吉他 音频、基频 工具
 */
class GuitarStringsHelper {
  /**
   * 吉他品的个数
   * 古典12品，民谣14品，19品吉他不常见呀~
   */
  private guitarPinsTotal = 14;

  /**
   * 默认的一组12平均律
   */
  private musicalAlphabets = Array.of(
    { name: 'C', blackKeys: false },
    { name: 'C♯', alias: 'D♭', blackKeys: true },
    { name: 'D', blackKeys: false },
    { name: 'D♯', alias: 'E♭', blackKeys: true },
    { name: 'E', blackKeys: false },
    { name: 'F', blackKeys: false },
    { name: 'F♯', alias: 'G♭', blackKeys: true },
    { name: 'G', blackKeys: false },
    { name: 'G♯', alias: 'A♭', blackKeys: true },
    { name: 'A', blackKeys: false },
    { name: 'A♯', alias: 'B♭', blackKeys: true },
    { name: 'B', blackKeys: false }
  );

  /**
   * 在12平均律中，每根弦的空弦相对于标准音A4(1弦5品)的音程
   */
  private musicalInterval = [-5, -10, -14, -19, -24, -29];

  /**
   * key: 弦号:品号，如 五弦三品 5:3，如 四弦空弦 4:0
   * value: 音名、基频、弦、品的关系
   */
  private stringsPinsMa = new Map<string, MusicalAlphabetHolder>();

  /**
   * key: 音名音高，如 C4，G♯5
   * value: 音名、基频、弦、品的关系
   */
  private maStringsPins = new Map<string, MusicalAlphabetHolder>();

  private init(strings: number, maIdx: number, group: number) {
    for (let pins = 0; pins <= 14; pins++) {
      const musicalAlphabet = this.musicalAlphabets[maIdx++];
      const alh = {
        stringsPins: {
          strings,
          pins
        },
        musicalAlphabet: {
          name: musicalAlphabet.name,
          alias: musicalAlphabet.alias,
          blackKeys: musicalAlphabet.blackKeys,
          group,
          // 标准音A4的基频440Hz
          // 12平均律中，1弦1品(F4)相对A4的音程为-4
          // 则F4的基频为 440 * (2 ** (-4/12))
          // 以此类推
          freq: 440 * 2 ** ((this.musicalInterval[strings - 1] + pins) / 12)
        }
      };

      this.stringsPinsMa.set(`${strings}:${pins}`, alh);
      this.maStringsPins.set(
        `${alh.musicalAlphabet.name}${alh.musicalAlphabet.group}`,
        alh
      );

      if (maIdx >= 12) {
        // 一个12平均律遍历完成，进入下一个12平均律，音高升1
        maIdx = 0;
        group++;
      }

      console.info(
        'GuitarStrings init',
        `${strings}弦${pins}品`,
        `${alh.musicalAlphabet.name}${alh.musicalAlphabet.group}`,
        alh.musicalAlphabet.freq
      );
    }
  }

  constructor() {
    // 初始化 stringsPinsMa 、maStringsPins

    // 1弦空弦E4
    this.init(1, 4, 4);

    // 2弦空弦B3
    this.init(2, 11, 3);

    // 3弦空弦G3
    this.init(3, 7, 3);

    // 4弦空弦D3
    this.init(4, 2, 3);

    // 5弦空弦A2
    this.init(5, 9, 2);

    // 6弦空弦E2
    this.init(6, 4, 2);
  }

  /**
   * 如 getMaHolderByStringsAndPins(5, 3)
   * @param strings 弦号
   * @param pins  品号
   */
  getMaHolderByStringsAndPins(strings: number, pins: number) {
    return this.stringsPinsMa.get(`${strings}:${pins}`);
  }

  /**
   * 如 getMaHolderByMaAndGroup('C', 5)
   * @param musicalAlphabet 音名
   * @param group 音高
   */
  getMaHolderByMaAndGroup(musicalAlphabet: string, group: number) {
    return this.maStringsPins.get(`${musicalAlphabet}${group}`);
  }

  /**
   * 如 getMaHolderByMaGroup('C5')
   * @param musicalAlphabetGroup 带音高的音名
   */
  getMaHolderByMaGroup(musicalAlphabetGroup: string) {
    return this.maStringsPins.get(musicalAlphabetGroup);
  }
}

export default new GuitarStringsHelper();
