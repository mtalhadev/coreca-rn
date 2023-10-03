import range from 'lodash/range'
import { getUuidv4 } from '../../utils/Utils'

/**
 * ランダムなIDのリスト返す。
 * @param count - リストの長さ
 * @returns ランダムなidリスト
 */
export const _getRandomIds = (count: number): string[] => range(0, count).map(() => getUuidv4())
