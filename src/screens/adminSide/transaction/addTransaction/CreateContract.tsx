import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import EditProject from '../editTransaction/EditProject'
import EditContract from '../editTransaction/EditContract'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateContract'>
type RouteProps = RouteProp<RootStackParamList, 'CreateContract'>

const CreateContract = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    return <EditContract mode="new" />
}
export default CreateContract

const styles = StyleSheet.create({})
