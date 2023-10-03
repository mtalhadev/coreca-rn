import React from 'react'
import { StyleSheet } from 'react-native'
import { RouteProp } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { SwitchEditOrCreateProps } from '../../../utils/Utils'
import EditDepartment from './EditDepartment'
import { RootStackParamList } from '../../Router'

type NavProps = StackNavigationProp<RootStackParamList, 'CreateDepartment'>
type RouteProps = RouteProp<RootStackParamList, 'CreateDepartment'>

const CreateDepartment = (props: Partial<SwitchEditOrCreateProps>) => {
    return <EditDepartment mode="new" />
}
export default CreateDepartment

const styles = StyleSheet.create({})
