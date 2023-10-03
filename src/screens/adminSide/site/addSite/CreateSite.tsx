import React from 'react'
import { StyleSheet } from 'react-native'
import { RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { SwitchEditOrCreateProps } from '../../../../utils/Utils'
import EditSite from '../editSite/EditSite'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateSite'>
type RouteProps = RouteProp<RootStackParamList, 'CreateSite'>

const CreateSite = (props: Partial<SwitchEditOrCreateProps>) => {
    return <EditSite mode="new" />
}
export default CreateSite

const styles = StyleSheet.create({})
