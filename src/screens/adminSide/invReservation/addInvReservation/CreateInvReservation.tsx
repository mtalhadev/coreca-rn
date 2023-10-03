import React from 'react'
import { StyleSheet } from 'react-native'
import { RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { SwitchEditOrCreateProps } from '../../../../utils/Utils'
import EditInvReservation from '../editInvReservation/EditInvReservation'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateInvReservation'>
type RouteProps = RouteProp<RootStackParamList, 'CreateInvReservation'>

const CreateInvReservation = (props: Partial<SwitchEditOrCreateProps>) => {
    return <EditInvReservation mode="new" />
}
export default CreateInvReservation

const styles = StyleSheet.create({})
