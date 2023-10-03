import React, { useCallback, useState } from 'react'
import { View, ScrollView } from 'react-native'
import { AppButton } from '../../../components/atoms/AppButton'
import { InputTextBox } from '../../../components/organisms/inputBox/InputTextBox'
import { pickImage, pickVideo } from '../../../utils/Utils'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { UserInfoForInquiry } from '../../../components/template/UserInfoForInquiry'
import { ProblemsInquiryAttachment } from '../../../components/organisms/inquiry/ProblemsInquiryAttachment'
import { UserInfoForInquiryType } from '../../../models/_others/Inquiry'
import { useDispatch } from 'react-redux'
import { setToastMessage } from '../../../stores/UtilSlice'
import { sendInquiry } from '../../../usecases/inquiry/InquiryCase'
import { _uriToBase64 } from '../../../services/_others/uriToMp4'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../Router'
import { useTextTranslation } from './../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'ProblemsInquiry'>
type RouteProps = RouteProp<RootStackParamList, 'ProblemsInquiry'>
type attachedType = 'video' | 'image'
const ProblemsInquiry = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const userData = route.params ?? {}
    const [attachedImage, setAttachedImage] = useState<ImageInfo[]>([])
    const [attachedVideo, setAttachedVideo] = useState<ImageInfo[]>([])
    const [inputProblemValue, setInputProblemValue] = useState<string>()
    const dispatch = useDispatch()
    const userInfo: UserInfoForInquiryType = {
        workerData: {
            name: userData?.worker?.name,
            mailAddress: userData?.worker?.account?.email,
            phoneNumber: userData.worker?.phoneNumber,
        },
        companyData: {
            address: userData.company?.address,
            name: userData?.company?.name,
            phoneNumber: userData.company?.phoneNumber,
        },
        inquiryType: 'problem',
        sendProblemsInfo: {
            textInfo: inputProblemValue,
            attachedImage: attachedImage,
            attachedVideo: attachedVideo,
        },
    }
    const phoneNumber = userInfo.companyData.phoneNumber ?? userInfo.workerData.phoneNumber
    const _deleteAttachedImage = async (selectImageIndex: number) => {
        const spliceResult = attachedImage.filter((imageVal) => imageVal !== attachedImage[selectImageIndex])
        setAttachedImage(spliceResult)
    }
    const _deleteAttachedVideo = async (selectVideoIndex: number) => {
        const spliceResult = attachedVideo.filter((videoVal) => videoVal !== attachedVideo[selectVideoIndex])
        setAttachedVideo(spliceResult)
    }
    const _setAttached = useCallback(async (attachedType: attachedType) => {
        if (attachedType === 'image') {
            const resultImage = await pickImage()
            if (resultImage) {
                setAttachedImage([...attachedImage, resultImage])
            }
        }
        if (attachedType === 'video') {
            const resultVideo = await pickVideo()
            if (!resultVideo?.uri) {
                return
            }
            const mp4Result = await _uriToBase64(resultVideo?.uri)
            if (!mp4Result) {
                return
            }
            resultVideo.base64 = mp4Result.success
            if (resultVideo) {
                setAttachedVideo([...attachedVideo, resultVideo])
            }
        }
    }, [])
    const _submitInquiry = useCallback(
        async (problemText?: string) => {
            if (
                userInfo.companyData.address !== undefined &&
                userInfo.workerData.name !== undefined &&
                userInfo.companyData.name !== undefined &&
                phoneNumber !== undefined &&
                userInfo.workerData.mailAddress !== undefined &&
                problemText !== undefined &&
                userInfo.sendProblemsInfo !== undefined
            ) {
                userInfo.sendProblemsInfo.textInfo = problemText
                userInfo.sendProblemsInfo.attachedImage = attachedImage
                userInfo.sendProblemsInfo.attachedVideo = attachedVideo

                const sendResult = await sendInquiry(userInfo)
                if (sendResult.success) {
                    dispatch(
                        setToastMessage({
                            text: t('admin:InquirySent'),
                            type: 'success',
                        }),
                    )
                } else {
                    dispatch(
                        setToastMessage({
                            text: t('admin:InquiryFailed'),
                            type: 'error',
                        }),
                    )
                }
            } else {
                if (problemText === undefined) {
                    dispatch(
                        setToastMessage({
                            text: t('admin:InquiryNotFilled'),
                            type: 'error',
                        }),
                    )
                } else {
                    const toastMessageName = userInfo.workerData.name !== undefined ? '' : t('common:Name')
                    const toastMessageAddress = userInfo.companyData.address !== undefined ? '' : t('common:Address')
                    const toastMessageCompanyName = userInfo.companyData.name !== undefined ? '' : t('common:TradeName')
                    const toastMessagePhoneNumber = phoneNumber !== undefined ? '' : t('common:PhoneNumber')
                    const toastMailAddress = userInfo.workerData.mailAddress !== undefined ? '' : t('common:EmailAddress')
                    dispatch(
                        setToastMessage({
                            text: toastMessageName + toastMessageAddress + toastMessageCompanyName + toastMessagePhoneNumber + toastMailAddress + t('admin:EnterOnYourOwnPage'),
                            type: 'error',
                        }),
                    )
                }
            }
        },
        [attachedImage, attachedVideo],
    )
    return (
        <ScrollView
            keyboardShouldPersistTaps={'always'}
            style={{
                flex: 1,
                paddingTop: 10,
            }}>
            <UserInfoForInquiry workerData={userInfo.workerData} companyData={userInfo.companyData} />
            <View style={{ marginTop: 20 }}>
                <InputTextBox
                    title={t('admin:QuestionsAbout')}
                    height={100}
                    required={true}
                    multiline={true}
                    onValueChangeValid={(val) => {
                        setInputProblemValue(val)
                    }}
                />
            </View>
            <View
                style={{
                    marginRight: 20,
                    marginLeft: 20,
                }}>
                <ProblemsInquiryAttachment
                    buttonTitle={t('common:AttachPhoto')}
                    deleteAttachedData={_deleteAttachedImage}
                    thubnailType={'image'}
                    attachData={attachedImage}
                    onPress={async () => {
                        _setAttached('image')
                    }}
                />
                {/* Androidのビルドが通らないため */}
                {/* <ProblemsInquiryAttachment
                    buttonTitle={t('common:AttachVideo')}
                    deleteAttachedData={_deleteAttachedVideo}
                    thubnailType={'video'}
                    attachData={attachedVideo}
                    onPress={async () => {
                        _setAttached('video')
                    }}
                /> */}
            </View>
            <AppButton
                title={t('admin:InquireAbove')}
                style={{
                    margin: 20,
                }}
                onPress={() => {
                    _submitInquiry(inputProblemValue)
                }}
            />
        </ScrollView>
    )
}
export default ProblemsInquiry
