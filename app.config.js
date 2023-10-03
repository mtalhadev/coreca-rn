const today = new Date()
const paddingZero = (num, padding = 2) => ('00' + num.toString()).slice(-padding)
/**
 * 日時に連動してビルドバージョンを上げるようにする
 * 目的：ビルドナンバーの設定忘れが多くビルドし直しが頻発
 * Androidは21,0000,0000以下のビルドバージョンでないといけない
 * 例：2022/09/16 19:36
 * buildVersion == 220916193（9桁）
 */
const buildVersion = `${today.getFullYear() % 1000}${paddingZero(today.getMonth() + 1)}${paddingZero(today.getDate())}${paddingZero(today.getHours())}${Math.floor(today.getMinutes() / 10)}`

/**
 * ## EAS_BUILD_PROFILE
 * EAS build時のみのbuild-in環境変数でlocalビルド時は使用しない。
 * CONFIG_ENVがクラウドビルドで反映されないので使用した。
 */
const isProduction = process.env.EAS_BUILD_PROFILE == 'production' || process.env.CONFIG_ENV == 'production'

export default {
    expo: {
        name: 'CORECA',
        slug: 'coreca-app',
        /**
         * version a.b.c
         * a => 開発フェーズ
         * b => 機能単位
         * c => 微調整・バグ改修など
         */
        version: '1.2.18',
        scheme: 'coreca',
        owner: 'coreca-app',
        orientation: 'portrait',
        icon: './assets/icon.png',
        splash: {
            image: './assets/splash.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff'
        },
        userInterfaceStyle: 'automatic',
        updates: {
            fallbackToCacheTimeout: 0
        },
        assetBundlePatterns: [
            '**/*'
        ],
        jsEngine: 'hermes',
        /**
         * [runtimeVersion]
         * expoにおいて、buildとupdateを紐づけるための番号。eas updateに使用。
         * 違うruntimeVersionのbuildとupdateは、たとえ同じchannel（preview or production）だとしても紐づかない。
         * 
         * *********************************************
         * ネイティブ側の実装を変更するたびに（＝eas updateの更新範囲を外れるたびに）、上げる必要がある。
         * *********************************************
         */
        runtimeVersion: '1.0.2',
        updates: {
            url: 'https://u.expo.dev/59069ef3-dca6-4254-bfcf-737600e0d9af'
        },
        plugins: [
            'expo-location',
            /**
             * RNFB v14かv15かでV14とV15を切り替える。
             */
            './withReactNativeFirebaseV14.js',
            /**
             * firebaseをinitializeするために必要。
             */
            '@react-native-firebase/app',
            '@react-native-firebase/crashlytics',
            /**
             * firebase RN 15.11.1では必要ない。
             */
            // 'expo-build-properties',
            // {
            //     'ios': {
            //         // これを入れるとreact-native-google-mapsがiOSでコンパイルできなくなる。
            //         'useFrameworks': 'static'
            //     }
            // }
        ],
        ios: {
            /**
             * eas build時にAPP_ENV=developmentのように環境変数を渡すことでprocess.env.APP_ENVに反映される。
             */
            googleServicesFile: isProduction ? './GoogleService-Info-prod.plist' : './GoogleService-Info.plist',
            /**
             * プロダクションデプロイするたびにここの数字をあげる。
             */
            buildNumber: buildVersion,
            supportsTablet: false,
            config: {
                googleMapsApiKey: isProduction ? 'AIzaSyDw_6r8Iz_hJA_s8Eb3e2fB7sIUzBxQu3A' : 'AIzaSyChP4D62c934K82nJmwNF1R7759QriMrEQ'
            },
            associatedDomains: [
                'applinks:coreca-test.web.app'
            ],
            infoPlist: {
                'CFBundleDevelopmentRegion': 'ja_JP',
                'NSPhotoLibraryUsageDescription': 'アイコン画像をアップロードするためにフォトライブラリを使用します。',
                'NSLocationAlwaysUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。',
                'NSLocationUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。',
                'NSLocationWhenInUseUsageDescription': '現場管理者に勤務場所を共有するために位置情報を取得します。'
            },
            /**
             * 開発ビルドでは使わない
             */
            bundleIdentifier: 'com.coreca.app',
        },
        android: {
            /**
             * プロダクションデプロイするたびにここの数字をあげる。
             */
            versionCode: Number(buildVersion) ?? parseInt(buildVersion, 10),
            adaptiveIcon: {
	        // アプリ・アイコンで画像が正しくリサイズされないので、元の画像に太さ250ptの枠をつけて1024×1024にリサイズしたものを使用
                foregroundImage: './assets/icon_resize_250.png',
                backgroundColor: '#FFFFFF'
            },
            googleServicesFile: isProduction ? './google-services-prod.json' : './google-services.json',
            config: {
                googleMaps: {
                    apiKey: (isProduction ? 'AIzaSyA4aJmvyl2byxclV7Za_jWTCIhjMOLcixE' : 'AIzaSyBo1Xp_CBN6_jfsGiV6n_17K8iqDFXRlgQ')
                }
            },
            intentFilters: [{
                action: 'VIEW',
                data: [{
                    scheme: 'coreca'
                }],
                category: [
                    'BROWSABLE',
                    'DEFAULT'
                ]
            },
            {
                action: 'VIEW',
                autoVerify: true,
                data: [{
                    scheme: 'https',
                    host: 'coreca-test.web.app',
                    pathPrefix: '/inviteCompany'
                },
                {
                    scheme: 'https',
                    host: 'coreca-test.web.app',
                    pathPrefix: '/inviteWorker'
                }],
                category: [
                    'BROWSABLE',
                    'DEFAULT'
                ]
            }],
            permissions: [
                'NOTIFICATIONS',
                'ACCESS_COARSE_LOCATION',
                'ACCESS_FINE_LOCATION',
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.FOREGROUND_SERVICE'
            ],
            /**
             * 開発ビルドでは使わない
             */
            package: 'com.coreca.app',
            
        },
        extra: {
            eas: {
                projectId: '59069ef3-dca6-4254-bfcf-737600e0d9af'
            },
            useFunctionEmulator: process.env.FUNCTION_EMULATE,
            useFirebaseOfficialEmulator: process.env.FIREBASE_OFFICIAL_EMULATE,
            useFirebaseOfficialEmulatorHost: '127.0.0.1', // 公式エミュレータを動かす開発PCのIPを入れてください
        },
        
    },
    web: {
        favicon: './assets/favicon.png'
    },

}
