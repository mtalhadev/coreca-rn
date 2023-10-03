import { useCallback } from 'react'
import { useTranslation, UseTranslationResponse } from 'react-i18next'
import { match } from 'ts-pattern'
import ja from './../localization/translations/ja'

const __translate = (path: string | undefined): string => {
    if (path == undefined || typeof path != 'string') {
        return ''
    }
    const [filePath, textName] = path.split(':')
    return match(filePath)
        .with('admin', () => (ja.admin as any)[textName])
        .with('worker', () => (ja.worker as any)[textName])
        .otherwise(() => (ja.common as any)[textName])
}

/**
 * @remarks for wrapping useTranslation
 * @author Hiruma
 */
export const useTextTranslationTest = () => ({ t: __translate })

/**
 * when undoing
 */
export const useTextTranslation = () => useTranslation()
