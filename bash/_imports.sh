#!/bin/sh
# importと<Screen>の作成

DIRS=`ls -1R src/screens/* | grep ':'`
for DIR in $DIRS
do
DIR=`echo ${DIR/%?/}`
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | sed -e 's/.tsx$//g'`
IMPORT=$DIR/$BASE
echo import $BASE from \'./${IMPORT:12}\'
done
done

DIRS=`ls -1R src/screens/* | grep ':'`
for DIR in $DIRS
do
DIR=`echo ${DIR/%?/}`
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | sed -e 's/.tsx$//g'`
echo "<MyStack.Screen name='$BASE' component={$BASE} options={{}} />"
done
done

DIRS=`ls -1R src/screens/* | grep ':'`
for DIR in $DIRS
do
DIR=`echo ${DIR/%?/}`
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | sed -e 's/.tsx$//g'`
echo "$BASE: DefaultStackType"
done
done

DIRS=`ls -1R src/screens/* | grep ':'`
for DIR in $DIRS
do
DIR=`echo ${DIR/%?/}`
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | sed -e 's/.tsx$//g'`
echo "<Pressable style={[styles.pressable]} onPress={() => {navigation.navigate('$BASE')}}><Text style={[styles.text]}>$BASE</Text></Pressable>"
done
done

DIRS=`ls -1R src/components/*`
echo $DIRS
for DIR in $DIRS
do
# DIR=`echo ${DIR/%?/}`
# echo $DIR
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | cut -d '/' -f 3 | sed -e 's/.tsx$//g'`
echo "<View style={styles.view}><Text style={styles.text}>$BASE</Text><$BASE /></View>"
done
done

DIRS=`ls -1R src/components/*`
echo $DIRS
for DIR in $DIRS
do
FILES=`ls $DIR | grep '.tsx'`
for FILE in $FILES
do
BASE=`echo ${FILE} | cut -d '/' -f 3 | sed -e 's/.tsx$//g'`
echo "import { ${BASE} } from '../../components/${BASE}'"
done
done