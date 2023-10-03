import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import ThreadList from '../../../../components/organisms/chat/chatList/ThreadList'

const AdminThreadList = () => {

    return <ThreadList side={'admin'} />
}
export default AdminThreadList

const styles = StyleSheet.create({})
