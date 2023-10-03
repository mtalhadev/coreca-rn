import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import EditConstruction from '../editConstruction/EditConstruction'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateConstruction'>
type RouteProps = RouteProp<RootStackParamList, 'CreateConstruction'>

const CreateConstruction = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    return <EditConstruction mode="new" />
}
export default CreateConstruction

const styles = StyleSheet.create({})
