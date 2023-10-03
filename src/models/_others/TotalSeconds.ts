/**
 * DBでのデータ表現（TZ共通）。Number(new Date())で取得できる数。
 */
export type TotalSeconds = number

/**
 * 引数として渡したときにYYYY-01-01-00:00の形になるようにする。
 */
export type YYYYTotalSecondsParam = number

/**
 * 引数として渡したときにYYYY-MM-01-00:00の形になるようにする。
 */
export type YYYYMMTotalSecondsParam = number

/**
 * 引数として渡したときにYYYY-MM-DD-00:00の形になるようにする。
 */
export type YYYYMMDDTotalSecondsParam = number

/**
 * 引数として渡したときに1900-01-01-HH:mmの形になるようにする。
 * new Date(0, 0, 1, HH, mm)
 */
export type HHmmTotalSecondsParam = number