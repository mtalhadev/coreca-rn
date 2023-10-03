/**
 * @deprecated
 * 案件・工事を作成する画面に置き換え (CreateConstruction)
 */
import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import EditProject from '../editTransaction/EditProject'
type NavProps = StackNavigationProp<RootStackParamList, 'CreateProject'>
type RouteProps = RouteProp<RootStackParamList, 'CreateProject'>

const CreateProject = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    return <EditProject mode="new" />
}
export default CreateProject

const styles = StyleSheet.create({})
