import React, { useState, useRef, useEffect } from 'react'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import SelectOnetooneOrCustom from '../../../../components/organisms/chat/chatSettings/SelectOnetooneOrCustom'

const WorkerSelectOnetooneOrCustom = () => {

    return <SelectOnetooneOrCustom side={'worker'} />
}
export default WorkerSelectOnetooneOrCustom

const styles = StyleSheet.create({})
