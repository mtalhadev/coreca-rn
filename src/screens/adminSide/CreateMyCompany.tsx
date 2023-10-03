import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import EditMyCompany from './EditMyCompany'

type NavProps = StackNavigationProp<RootStackParamList, 'CreateMyCompany'>
type RouteProps = RouteProp<RootStackParamList, 'CreateMyCompany'>

const CreateMyCompany = () => {
    return <EditMyCompany mode={'new'} />
}
export default CreateMyCompany

const styles = StyleSheet.create({})
