import { Dimensions, Platform, StatusBar } from 'react-native'
import * as Linking from 'expo-linking'
import { newDate } from './ext/Date.extensions'
import { isIphoneX } from 'react-native-iphone-x-helper'
import { useTextTranslationTest } from './../fooks/useTextTranslation'

const { t } = useTextTranslationTest()

export const THEME_COLORS = {
    BLUE: {
        MIDDLE: '#0082C7',
        LIGHT: '#0D93DB',
        SUPER_LIGHT: '#F8FBFD',
        MIDDLE_DEEP: '#0D6CB2',
        DEEP: '#194577',
        SUPER_DEEP: '#041C38',
        HIGH_LIGHT: '#00B3F3',
    },
    GREEN: {
        MIDDLE: '#C7D601',
        LIGHT: '#D6E600',
        SUPER_LIGHT: '#F7F8F2',
        DEEP: '#6C8D00',
        SUPER_DEEP: '#405205',
        HIGH_LIGHT: '#fff',
    },
    OTHERS: {
        GRAY: '#737680',
        BACKGROUND: '#F7F7F8',
        BORDER_COLOR: '#C9C9C9',
        BORDER_COLOR2: '#606060',
        PURPLE_GRAY: '#F5F4F7',
        LIGHT_GRAY: '#aaa',
        SUPER_LIGHT_GRAY: '#eee',
        ALERT_RED: '#EA2727',
        WARN_ORANGE: '#EA7227',
        PARTNER_GREEN: '#30AA96',
        CUSTOMER_PURPLE: '#5161B9',
        TIMER_SKY_BLUE: '#D3E3EB',
        TABLE_AREA_PURPLE: '#F3F2F4',
        LINK_BLUE: '#0074B2',
        LIGHT_PINK: '#EBD3D3',
        LIGHT_PURPLE: '#D7D6EA',
        LIGHT_ORANGE: '#EAE1D6',
        LIGHT_GREEN: '#D6EAD8',
        SUCCESS_GREEN: '#14AF26',
        BLACK: '#343538',
    },
}

/**
 * ios: SCREEN_HEIGHT == WINDOW_HEIGHT
 * android: SCREEN_HEIGHT == WINDOW_HEIGHT + BOTTOM_NAV_BAR_HEIGHi18n.t(24) + STATUS_BAR_HEIGHi18n.t(24)
 */
export const WINDOW_WIDTH = Dimensions.get('window').width
export const WINDOW_HEIGHT = Dimensions.get('window').height
export const SCREEN_WIDTH = Dimensions.get('screen').width
export const SCREEN_HEIGHT = Dimensions.get('screen').height

export const ANDROID_STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 24
export const IOS_STATUS_BAR_HEIGHT = 20 as const
/**
 * ノッチ部分の最大プラス分。24〜30pxまであるので。
 */
export const IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS = 30 as const
export const getStatusBarHeightWithNotch = (): number => {
    if (Platform.OS == 'android') {
        return ANDROID_STATUS_BAR_HEIGHT
    } else if (Platform.OS == 'ios') {
        if (isIphoneX()) {
            return IOS_STATUS_BAR_HEIGHT + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS
        } else {
            return IOS_STATUS_BAR_HEIGHT
        }
    }
    return 0
}

export const IPHONEX_BOTTOM_HEIGHT = 34 as const

export const BOTTOM_TAB_BASE_HEIGHT = 60

/**
 * トップのナヴィゲーションバーの高さ
 */
export const IOS_NAV_BAR_HEIGHT = 44 as const
export const ANDROID_NAV_BAR_HEIGHT = 56 as const
export const getNavBarHeight = (): number => {
    if (Platform.OS == 'android') {
        return ANDROID_NAV_BAR_HEIGHT
    } else if (Platform.OS == 'ios') {
        return IOS_NAV_BAR_HEIGHT
    }
    return 0
}

/**
 *
 * @returns ナビゲーションとステータスバーの合計。
 */
export const getTopBarHeight = () => getNavBarHeight() + getStatusBarHeightWithNotch()

/**
 * 作成・編集画面で入力フィールドの間隔を調整する (正値なら間隔を狭くする)

 */
export const dMarginTop = 10

export const ACTION_CODE_SETTINGS = {
    //url: Linking.makeUrl(),
    // unauthorized-domainのエラーが出る場合は、
    // urlがfirebaseのAuthentication>>Settings>>Authorized domainsに登録済みのドメインであるか確認
    url: __DEV__ ? 'https://coreca-98a22.firebaseapp.com' : 'https://coreca-test.firebaseapp.com',
    handleCodeInApp: true,
    iOS: {
        bundleId: 'com.coreca.app',
    },
    android: {
        packageName: 'com.coreca.app',
        installApp: true,
        minimumVersion: '12',
    },
    dynamicLinkDomain: 'coreca.page.link',
}

export const PLACEHOLDER = {
    ADDRESS: t('common:AddressPlaceholder'),
    EMAIL: 'coreca_sample@coreca.jp',
    PERSON_NAME: t('common:PersonName'),
    PERSON_NICKNAME: t('common:PersonNickname'),
    COMPANY_NAME: t('common:CompanyName'),
    PROJECT_NAME: t('common:ProjectName'),
    PROJECT_TYPE: t('common:ProjectType'),
    CONSTRUCTION_NAME: t('common:ConstructionNamePlaceholder'),
    COMPANY_PHONE: '03-0000-0000',
    MOBILE_PHONE: '090-0000-0000',
    INDUSTRY: t('common:IndustryPlaceholder'),
    BELONGING: t('common:FillInWhatIsNeededForWork'),
    REMARKS: t('common:RemarksPlaceholder'),
    DEPARTMENT: t('common:DepartmentPlaceholder'),
    PASSWORD: 'PassWord0123',
    HOLIDAYS: t('common:HolidaysPlaceholder'),
    TITLE: t('common:TitlePlaceholder'),
    ROLE: t('common:RolePlaceholder'),
    OFFICE: t('common:OfficePlaceholder'),
    INVITE_URL: t('common:EnterInvitationUrl'),
    GROUP_NAME: t('admin:GroupName'),

    // ADDRESS: '東京都〇〇区〇〇9-99-9、CORECAビル 9F',
    // EMAIL: 'coreca_sample@coreca.jp',
    // PERSON_NAME: 'コレカ　太郎',
    // COMPANY_NAME: 'コレカ株式会社',
    // PROJECT_NAME: '〇〇不動産建設、〇〇店舗内装、〇〇道路工事など',
    // COMPANY_PHONE: '03-0000-0000',
    // MOBILE_PHONE: '090-0000-0000',
    // INDUSTRY: '例）建築工事、解体工事、内装工事など',
    // BELONGING: '作業に必要な物を記入。',
    // REMARKS: '注意事項や連絡事項など',
    // DEPARTMENT: '〇〇部署',
    // PASSWORD: 'PassWord0123',
    // HOLIDAYS: '休日を選択',
    // ROLE: '権限を選択',
    // OFFICE: '手配可否を選択',
    // INVITE_URL: '招待URLを入力',
}

export const MAX_PROJECT_SPAN = 10000
export const MAX_DAMMY_WORKER_SPAN = 31

export const MAX_REQUEST_DAMMY_WORKER_NUM = 999

export const PRIVACY_POLICY_URL = 'https://www.igawa.co.jp/coreca'
export const WORKER_TERMS_OF_SERVICE_URL = 'https://www.igawa.co.jp/coreca'
export const COMPANY_TERMS_OF_SERVICE_URL = 'https://www.igawa.co.jp/coreca'
export const SPECIFIED_COMMERCIAL_URL = 'https://www.igawa.co.jp/coreca'

export const DEFAULT_SITE_MEETING_TIME_OBJ = { hour: 7, minute: 30 }
export const DEFAULT_SITE_START_TIME_OBJ = { hour: 8, minute: 0 }
export const DEFAULT_SITE_END_TIME_OBJ = { hour: 17, minute: 0 }

export const DEFAULT_SITE_MEETING_TIME = newDate(DEFAULT_SITE_MEETING_TIME_OBJ).toCustomDate()
export const DEFAULT_SITE_START_TIME = newDate(DEFAULT_SITE_START_TIME_OBJ).toCustomDate()
export const DEFAULT_SITE_END_TIME = newDate(DEFAULT_SITE_END_TIME_OBJ).toCustomDate()

export const INITIAL_CONSTRUCTION_NAME = 'デフォルト'

export const LOCK_INTERVAL_TIME = 5000

export const INQUIRY_EMAIL_LIST = ['hiruma@coreca.jp', 'miyamura@coreca.jp', 'igawa@coreca.jp']

export const COMPANY_ACCOUNT_INFO_EMAIL_LIST = ['info@coreca.jp', 'hidatomuho@gmail.com']

export const MY_TODOS = '@coreca:my-todos'
