#!/bin/bash
# ファイル上書きがあるので使用禁止！

DIRS=`ls -1R src/screens/* | grep ':'`
for DIR in $DIRS
do
DIR=`echo ${DIR/%?/}`

FILES=`ls $DIR | grep '.tsx' | grep -v 'Router.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | sed -e 's/.tsx$//g'`
FILEDIR=$DIR/$BASE.tsx
cat <<EOF > $FILEDIR
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'

const $BASE = ({ navigation }: any) => {
    return (
        <View>
            <Text>$BASE</Text>
        </View>
    )
}
export default $BASE

const styles = StyleSheet.create({
    
})
EOF
done

ROUTER_FILES=`ls $DIR | grep '.tsx' | grep 'Router.tsx'`
for ROUTER_FILE in $ROUTER_FILES
do
ROUTER_OTHER_FILES=`ls $DIR | grep '.tsx' | grep -v 'Router.tsx'`

LF="
"
LF=$(printf '\n_');LF=${LF%_}

SCREENS= 
IMPORTS=
for ROUTER_OTHER_FILE in $ROUTER_OTHER_FILES
do
ROUTER_OTHER_BASE=`echo ${ROUTER_OTHER_FILE} | sed -e 's/.tsx$//g'`
SCREENS="$SCREENS\
<TabStack.Screen name='$ROUTER_OTHER_BASE' component={$ROUTER_OTHER_BASE} />$LF"
IMPORTS="$IMPORTS\
    import $ROUTER_OTHER_BASE from './$ROUTER_OTHER_BASE'$LF"
done

ROUTER_BASE=`echo ${ROUTER_FILE} | sed -e 's/.tsx$//g'`
ROUTER_FILEDIR=$DIR/$ROUTER_BASE.tsx
cat <<EOF > $ROUTER_FILEDIR
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
$IMPORTS

const TabStack = createMaterialTopTabNavigator()

const $ROUTER_BASE = ({ navigation }: any) => {
    return (
        <TabStack.Navigator>
$SCREENS
        </TabStack.Navigator>
    )
}
export default $ROUTER_BASE

const styles = StyleSheet.create({
    
})
EOF
done
done

yarn lint:fix