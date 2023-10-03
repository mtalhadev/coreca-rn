import i18n, { Module } from 'i18next'
import backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as RNLocalize from 'react-native-localize'

import en from './translations/en'
import ja from './translations/ja'

const LANGUAGES = {
    en,
    ja,
}

const LANG_CODES = Object.keys(LANGUAGES)
const DEFAULT_LANG = 'js'

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: (callback: (arg0: string) => void) => {
        AsyncStorage.getItem('user-language', (err, language) => {
            if (err || !language) {
                if (err) {
                    console.log('Error fetching Languages from asyncstorage ', err)
                } else {
                    console.log('No language is set, choosing English as fallback')
                }
                const findBestAvailableLanguage = RNLocalize.findBestAvailableLanguage(LANG_CODES)
                // const findBestAvailableLanguage = { languageTag: 'en' }
                callback(findBestAvailableLanguage?.languageTag || DEFAULT_LANG)
                return
            }
            callback(language)
        })
    },
    init: () => {},
    cacheUserLanguage: (language: string) => {
        AsyncStorage.setItem('user-language', language)
    },
} as Module

i18n.use(LANGUAGE_DETECTOR)
    .use(backend)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources: LANGUAGES,
        react: {
            useSuspense: false,
        },
        interpolation: {
            escapeValue: false,
        },
    })
