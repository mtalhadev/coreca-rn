/**
 * @param success - 成功した際の返り値
 * @param error - 失敗した際のメッセージ
 * @param errorCode - 失敗した際のメッセージコード。大文字とアンダーバーで簡潔に構成する。（例：NO_ID, NOT_ENOUGH_INFO, WORKER_ERRORなど）
 * @param detail - エラー全体
 * @param type - エラーか注意か
 */
export class CustomResponse<T = boolean> {
    success?: T
    error?: string
    errorCode?: string
    detail?: any
    type?: 'error' | 'warn'
}
