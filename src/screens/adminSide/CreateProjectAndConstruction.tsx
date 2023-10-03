import React, { useState } from 'react'
import CreateConstruction from './construction/addConstruction/CreateConstruction'
import CreateInvReservation from './invReservation/addInvReservation/CreateInvReservation'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputDropDownBox } from '../../components/organisms/inputBox/InputDropdownBox'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { RootStackParamList } from '../Router'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/core'

// type NavProps = StackNavigationProp<RootStackParamList, 'CreateProjectAndConstruction'>
// type RouteProps = RouteProp<RootStackParamList, 'CreateProjectAndConstruction'>

type InputValue = string[]

const CreateProjectAndConstruction = () => {
    // const navigation = useNavigation<NavProps>()
    // const route = useRoute<RouteProps>()

    const { t } = useTextTranslation()
    const [projectType, setProjectType] = useState<InputValue>([t('admin:ContractingProject')])

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <InputDropDownBox
                style={{ marginTop: 30 }}
                title={t('admin:SelectProjectType')}
                required={true}
                value={projectType}
                selectableItems={[t('admin:ContractingProject'), t('admin:SupportingProject')]}
                selectNum={1}
                onValueChangeValid={(value) => {
                    setProjectType(value as InputValue)
                }}
            />
            {projectType?.includes(t('admin:ContractingProject')) ? <CreateConstruction /> : <CreateInvReservation />}
        </KeyboardAwareScrollView>
    )
}

export default CreateProjectAndConstruction
