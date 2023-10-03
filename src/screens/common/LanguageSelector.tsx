import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InputDropDownBox } from '../../components/organisms/inputBox/InputDropdownBox'
import { useTextTranslation } from './../../fooks/useTextTranslation'

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
]

const Selector = () => {
    const { t, i18n } = useTextTranslation()
    const selectedLanguageCode = i18n.language

    const setLanguage = (code: string) => {
        try {
            return i18n.changeLanguage(code)
        } catch (error) {
            console.log(error, 'error change language')
        }
    }

    const langs = LANGUAGES.map((item) => item.label)

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View>
                <View style={styles.card}>
                    <Text style={GlobalStyles.headerText}>{t('common:LanguageSelector')}</Text>
                    <InputDropDownBox
                        style={{ marginTop: 60 }}
                        title={t('common:LanguageSelector')}
                        required={true}
                        selectableItems={langs}
                        value={[LANGUAGES.find((item: any) => item.code == selectedLanguageCode)?.label || langs[0]] as string[]}
                        selectNum={1}
                        onValueChangeValid={(value: any) => {
                            if (value) {
                                const item = LANGUAGES.find((item: any) => item.label == value)
                                if (item?.code) {
                                    setLanguage(item.code || selectedLanguageCode)
                                }
                            }
                        }}
                    />
                    {/* {LANGUAGES.map((language) => {
                        const selectedLanguage = language.code === selectedLanguageCode
                        return (
                            <Pressable key={language.code} style={styles.buttonContainer} disabled={selectedLanguage} onPress={() => setLanguage(language.code)}>
                                <Text style={[selectedLanguage ? styles.selectedText : GlobalStyles.normalText]}>{language.label}</Text>
                            </Pressable>
                        )
                    })} */}
                </View>
            </View>
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 0,
        paddingHorizontal: 16,
        backgroundColor: BlueColor.lightColor,
    },
    buttonContainer: {
        marginTop: 10,
    },
    selectedText: {
        fontSize: 16,
        fontWeight: '600',
        color: BlueColor.mainColor,
        paddingVertical: 4,
    },
    card: {
        borderRadius: 10,
        padding: 20,
    },
})
export default Selector
