import { match } from 'ts-pattern'
export type AlertType = 'unsettled-site' | 'pre-report-attendance' | 'pre-arrange-worker' | 'waiting-other-company-arrangement'

export const getAlertText = (alert: AlertType): string | undefined => {
    return match(alert)
        .with('pre-arrange-worker', () => '未手配の作業員がいます。')
        .with('unsettled-site', () => '手配が未通知な現場があります。')
        .with('pre-report-attendance', () => '未報告の勤怠があります。')
        .with('waiting-other-company-arrangement', () => '依頼先会社の作業員の「手配待ち」があります。')
        .otherwise(() => undefined)
}
