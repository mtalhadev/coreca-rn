import React, { useEffect } from 'react'
import { LogBox, Platform } from 'react-native'
import store from './src/stores/Store'
import { Provider } from 'react-redux'
import Router from './src/screens/Router'
import { useFonts, NotoSansJP_100Thin, NotoSansJP_300Light, NotoSansJP_400Regular, NotoSansJP_500Medium, NotoSansJP_700Bold, NotoSansJP_900Black } from '@expo-google-fonts/noto-sans-jp'
import ENV from './env/env'
import { _initializeFirebase } from './src/services/firebase/FirebaseCoreService'
import './src/localization/DCSLocalize';
import { MenuProvider } from 'react-native-popup-menu'
/**
 * warnを非表示にする。
 */
LogBox.ignoreLogs(['Setting a timer', 'Require cycles are allowed', 'VirtualizedList: missing keys for items', 'ViewPropTypes will be removed from React Native.'])

_initializeFirebase()


const App = () => {
    const [fontsLoaded] = useFonts({
        NotoSansJP_100Thin,
        NotoSansJP_300Light,
        NotoSansJP_400Regular,
        NotoSansJP_500Medium,
        NotoSansJP_700Bold,
        NotoSansJP_900Black,
    })
    return (
        <MenuProvider>
        <Provider store={store}>
            {
                /**
                 * フォントロード前に使用してしまうエラーを避けるため。
                 */
                fontsLoaded && <Router></Router>
            }
        </Provider>
        </MenuProvider>
    )
}

export default App
