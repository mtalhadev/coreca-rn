import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import EditFakeCompany from '../editCompany/EditFakeCompany'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}
const CreateFakeCompany = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ id }, setState] = useState(initialState)
    const dispatch = useDispatch()

    return <EditFakeCompany mode={'new'} />
}
export default CreateFakeCompany

const styles = StyleSheet.create({})
