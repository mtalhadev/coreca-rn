import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import EditProject from '../editTransaction/EditProject'
import EditRequest from '../editTransaction/EditRequest'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateRequest'>
type RouteProps = RouteProp<RootStackParamList, 'CreateRequest'>

const CreateRequest = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    return <EditRequest mode="new" />
}
export default CreateRequest

const styles = StyleSheet.create({})
