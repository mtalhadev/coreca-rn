import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import EditGroupName from '../../../../components/organisms/chat/chatSettings/EditGroupName'

const AdminEditGroupName = () => {

    return <EditGroupName side={'admin'} />
}
export default AdminEditGroupName

const styles = StyleSheet.create({})
