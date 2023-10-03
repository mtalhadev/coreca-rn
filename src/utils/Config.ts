// import { AndroidConfig, ConfigPlugin, withAndroidManifest } from '@expo/config-plugins'
// import { ExpoConfig } from '@expo/config-types'

// const { addMetaDataItemToMainApplication, getMainApplicationOrThrow } = AndroidConfig.Manifest

// export const withMyCustomConfig: ConfigPlugin = config => {
//     return withAndroidManifest(config, async config => {
//         // Modifiers can be async, but try to keep them fast.
//         config.modResults = await setCustomConfigAsync(config, config.modResults)
//         return config
//     })
// }

// // Splitting this function out of the mod makes it easier to test.
// const setCustomConfigAsync = async (
//     config: Pick<ExpoConfig, 'android'>,
//     androidManifest: AndroidConfig.Manifest.AndroidManifest
// ): Promise<AndroidConfig.Manifest.AndroidManifest> => {
//     const appId = 'my-app-id'
//     // Get the <application /> tag and assert if it doesn't exist.
//     const mainApplication = getMainApplicationOrThrow(androidManifest)

//     addMetaDataItemToMainApplication(
//         mainApplication,
//         // value for `android:name`
//         'my-app-id-key',
//         // value for `android:value`
//         appId
//     )

//     return androidManifest
// }
