/**
 * 音名信息
 * 存储音名、音高、基频信息
 */
export interface MusicalAlphabet {
  /**
   * 音名
   */
  name: string;

  /**
   * 别名
   */
  alias?: string;

  /**
   * 是否对应钢琴上的黑键
   */
  blackKeys: boolean;

  /**
   * 音高
   */
  group?: number;

  /**
   * 基频
   */
  freq?: number;
}

/**
 * 存储弦、品的关系
 */
export interface StringsPinsHolder {
  /**
   * 弦号 1~6
   */
  strings: number;

  /**
   * 品号 0~14
   */
  pins: number;
}

/**
 * 存储音名、基频、弦、品的关系
 */
export interface MusicalAlphabetHolder {
  /**
   * 音名信息
   */
  musicalAlphabet: MusicalAlphabet;

  /**
   * 弦-品
   */
  stringsPins: StringsPinsHolder;
}
