import { CustomResponse } from '../../models/_others/CustomResponse'

export const getErrorMessage = (error: any): CustomResponse<any> => {
    const message = error?.error ?? error?.code ?? error?.message ?? error ?? 'エラー'
    if (__DEV__) {
        console.log(`Error: { message: ${message}, code: ${error?.errorCode}, line: ${error?.line} }`)
        error && console.log(error ?? '')
    }
    return {
        error: message,
        errorCode: error?.errorCode ?? undefined,
        detail: error,
        type: error.type ?? 'error'
    }
}

export const getErrorToastMessage = (_error: CustomResponse<any>): string => {
    return `${String(_error.error)?.replaceAll('undefined', 'なし') ?? 'なし'}\nエラーコード: ${_error.errorCode ?? 'なし'}`
}
