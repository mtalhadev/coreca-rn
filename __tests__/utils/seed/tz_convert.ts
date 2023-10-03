import { program } from 'commander'

/**
 * #### tz_convertテストの実行
 */
const tz_convert = async () => {
    // ISO String sample
    var d1 = new Date('2017-03-11T11:30:00')
    var d2 = new Date('2017-03-11T11:30:00Z')
    console.log(d1.toString()) // "Sat Mar 11 11:30:00 UTC+0900 2017"
    console.log(d2.toString()) // "Sat Mar 11 20:30:00 UTC+0900 2017"
    console.log(d1.getTime()) // 小さい
    console.log(d2.getTime()) // 大きい

    // テストパラメータ
    const sourceDate = new Date('2000-12-31T23:00:00Z')

    // テストパラメータのロケール別文字列
    console.log(`\nUTC: ${sourceDate.toLocaleString('ja-JP', { timeZone: 'UTC' })}`)
    console.log(`JST: ${sourceDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`)
    console.log(`USA: ${sourceDate.toLocaleString('ja-JP', { timeZone: 'America/New_York' })}`)

    // テスト関数の実行
    toCustomDateFromTotalSeconds(sourceDate.getTime(), true)
}

/**
 * @summary DateのmSec表現値からCustomDateを生成
 * @purpose Functionsへの移行に伴いUTCからローカルTimezoneへの変換処理を追加
 * @remark ローカルのTimezone offset（minutes値）をmSec変換して引数のsecondsから減算することでUTC（=offset値0）からローカルTimezone（日本なら+09:00）へ変換
 * @param seconds Date型オブジェクトのmSec表現値（＝offset値0のunix time）
 * @param isConvertToLocalTimezone ローカルTimezoneへ変換するか否かのフラグ
 * @returns CustomDate型オブジェクト
 * @errors なし
 * @throws なし
 * @author Okuda
 */
export const toCustomDateFromTotalSeconds = (seconds: number, isConvertToLocalTimezone = false) => {
    if (isConvertToLocalTimezone) {
        const sourceDate = new Date(seconds) // テスト用（secondsのDate表現、ローカルTimezone）
        const sourceTZOffset = new Date(seconds).getTimezoneOffset() // テスト用（Timezone Offsetはどのタイミングで取っても同じ）

        const localTZOffset = new Date().getTimezoneOffset() // テスト用（Timezone Offsetはどのタイミングで取っても同じ）
        const convertedSeconds = seconds - localTZOffset * 60 * 1000 // ここの演算子が + か - のいずれかでハマるはず

        const convertedDate = new Date(convertedSeconds) // テスト用（SecondsにOffsetを適用）
        const castedSeconds = Number(convertedDate) // テスト用（DateをNumberにキャストしてもgetTimeと同値であることを確認するため）
        const updatdeDate10 = new Date(convertedSeconds) // テスト用（日付を10日に変更すためののイミュータブルDate型オブジェクトを生成）
        const updatedDate10Seconds = updatdeDate10.setDate(10) // テスト用（イミュータブルDate型オブジェクトの日付を10日へ変更）

        //
        // console.logログはテスト用
        //
        console.log(`source    Seconds: ${seconds}`) // テスト用（seconds）
        console.log(`converted Seconds: ${convertedSeconds}`) // テスト用（Converted Seconds）
        console.log(`casteed   Seconds: ${castedSeconds}`) // テスト用（キャストとgetTimeが同じであることの確認用）
        console.log(`date10    Seconds: ${updatedDate10Seconds}`) // テスト用（日付を10日に変更したイミュータブルConverted Seconds）

        console.log(`source    Date: ${sourceDate}`) // テスト用（Source Date）
        console.log(`converted Date: ${convertedDate}`) // テスト用（Converted Date）
        console.log(`updated Date10: ${updatdeDate10}`) // テスト用（Date10 Date）

        console.log(`source Offset: ${sourceTZOffset}`) // テスト用（全てのタイミングでTimezoneOffsetが同値であることを確認
        console.log(`local  Offset: ${localTZOffset}`) //
        console.log(`conver Offset: ${convertedDate.getTimezoneOffset()}`) //
        console.log(`casted Offset: ${new Date(Number(convertedDate)).getTimezoneOffset()}`) //
    } else {
        //
        // console.logログはテスト用
        //
        console.log(`noConvertedDate: ${new Date(seconds)}`)
    }
}

// init seeder command
program.description('ローカルTimezone変換のテスト').version('0.9.0', '-v, --version').action(tz_convert)
program.parse(process.argv)
