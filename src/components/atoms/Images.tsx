import React, { useEffect, useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Image, FlatList, ListRenderItem, ListRenderItemInfo, ViewProps, ViewStyle, Pressable } from 'react-native';
import Modal from 'react-native-modal'
import { SCREEN_WIDTH, THEME_COLORS } from '../../utils/Constants'
import { Icon } from './Icon';
export type ImagesProps = {
    images: string[]
    onRemoveImage?: (uri: string) => void
}

export const Images = React.memo((props: Partial<ImagesProps>) => {

    const images = props.images || [];
    const onRemoveImage = props.onRemoveImage

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    
    const showImageListModal = (modalVisible: boolean, activeImageIndex: number) => {
        setActiveImageIndex(activeImageIndex)
        setModalVisible(modalVisible)
    };
    
    const lessThanThreeImages = () => {
        return (
          <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                marginBottom: 1,
                marginTop: 1,
          }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>
              {images?.map((image, i) => (
                <TouchableOpacity
                  key={`chat-image-${i}`}
                  onPress={() => showImageListModal(!modalVisible, i)}
                >
                    <Img
                        imageUrl={image}
                        style={{
                            width: (SCREEN_WIDTH)/images.length-3,
                            height: SCREEN_WIDTH,
                            marginHorizontal: 1
                        }}
                    />
                    <Pressable
                        onPress={()=> {
                            onRemoveImage && onRemoveImage(image) 
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: '#00000060',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    
                    >
                        <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                    </Pressable>

                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    };
    const threeImages = () => {
        return (
          <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                marginBottom: 1,
                marginTop: 1,
          }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
            }}>

                <TouchableOpacity
                  onPress={() => showImageListModal(!modalVisible, 0)}
                >
                    <Img
                        imageUrl={images[0]}
                        style={{
                            width: (SCREEN_WIDTH * 0.7) - 1,
                            height: SCREEN_WIDTH,
                            marginHorizontal: 1
                        }}
                    />
                    <Pressable
                        onPress={()=> {
                            onRemoveImage && onRemoveImage(images[0]) 
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            position: 'absolute',
                            top: 8,
                            right: 4,
                            backgroundColor: '#00000060',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    
                    >
                        <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                    </Pressable>
                </TouchableOpacity>
                <View 
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between'        
                    }}
                >
                {images?.slice(1).map((image, i) => (
                    <TouchableOpacity
                    key={`chat-image-${i}`}
                    onPress={() => showImageListModal(!modalVisible, i)}
                    >
                        <Img
                            imageUrl={image}
                            style={{
                                width: (SCREEN_WIDTH * 0.3) - 1,
                                height: SCREEN_WIDTH * 0.5 - 2,
                                marginHorizontal: 1,
                            
                            }}
                        />
                        <Pressable
                            onPress={()=> {
                                onRemoveImage && onRemoveImage(image) 
                            }}
                            style={{
                                width: 30,
                                height: 30,
                                borderRadius: 20,
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#00000060',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        
                        >
                            <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                        </Pressable>

                    </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
    };
    const fourImages = () => {
        return (
          <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                marginBottom: 1,
                marginTop: 1,
          }}>
            <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
            }}>
              {images?.map((image, i) => (
                <TouchableOpacity
                  key={`chat-image-${i}`}
                  onPress={() => showImageListModal(!modalVisible, i)}
                >
                    <Img
                        imageUrl={image}
                        style={{
                            width: (SCREEN_WIDTH/2)-2,
                            height: (SCREEN_WIDTH/2)-3,
                            margin: 1
                        }}
                    />
                    <Pressable
                        onPress={()=> {
                            onRemoveImage && onRemoveImage(image) 
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            position: 'absolute',
                            top: 8,
                            right: 4,
                            backgroundColor: '#00000060',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    
                    >
                        <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                    </Pressable>

                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
    };
    const moreThanFourImages = () => {
        return (
          <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                marginBottom: 1,
                marginTop: 1,
          }}>
            <View style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                justifyContent: 'space-between',
            }}>
                <TouchableOpacity
                  onPress={() => showImageListModal(!modalVisible, 0)}
                >
                    <Img
                        imageUrl={images[0]}
                        style={{
                            width: (SCREEN_WIDTH) - 2,
                            height: SCREEN_WIDTH * 0.7 - 2,
                            margin: 1
                        }}
                    />
                    <Pressable
                        onPress={()=> {
                            onRemoveImage && onRemoveImage(images[0]) 
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            position: 'absolute',
                            top: 8,
                            right: 4,
                            backgroundColor: '#00000060',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                    </Pressable>
                </TouchableOpacity>

                <ScrollView showsHorizontalScrollIndicator={false} horizontal>
                <View 
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start'        
                    }}
                >
                {images?.slice(1).map((image, i) => (
                <TouchableOpacity
                  key={`chat-image-${i}`}
                  onPress={() => showImageListModal(!modalVisible, i)}
                >
                    <Img
                        imageUrl={image}
                        style={{
                            width: (SCREEN_WIDTH * 0.3)-2,
                            height: (SCREEN_WIDTH * 0.3)-2,
                            margin: 1
                        }}
                    />
                    <Pressable
                        onPress={()=> {
                            onRemoveImage && onRemoveImage(image) 
                        }}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            position: 'absolute',
                            top: 8,
                            right: 4,
                            backgroundColor: '#00000060',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    
                    >
                        <Icon name='close' width={12} height={12} fill={THEME_COLORS.OTHERS.BACKGROUND}/>
                    </Pressable>

                </TouchableOpacity>
                ))}
                </View>
                </ScrollView>
            </View>
          </View>
        );
    };    
    
    return (
          <View
            style = {
                {
                    backgroundColor: '#FFF',
                    width: SCREEN_WIDTH,
                    height: SCREEN_WIDTH,
                    marginVertical: 10
                }
            }
          >
            {images.length < 3 && lessThanThreeImages()}
            {images.length === 3 && threeImages()}
            {images.length === 4 && fourImages()}
            {images.length > 4 && moreThanFourImages()}

            <ImageList 
                isVisible={modalVisible}
                focusIndex={activeImageIndex}
                images={images}
                closeModal={() => setModalVisible(false)}
                onImagePress={(index) => {}}
            />
          </View>
        );
})

type ImageListProps = {
    isVisible: boolean
    images: string[]
    focusIndex: number
    closeModal: () => void
    onImagePress?: (index: number) => void
}
const flatlistRef = React.createRef<FlatList>();
const ITEM_WIDTH = SCREEN_WIDTH - 40;
const ITEM_HEIGHT = SCREEN_WIDTH - 40;

const ImageList = React.memo((props: Partial<ImageListProps>) => {

    const { isVisible, images, focusIndex, onImagePress, closeModal } = props

    useEffect(() => {
        setTimeout(() => {
          flatlistRef.current?.scrollToIndex({
            index: focusIndex ?? 0,
            animated: true
          });
        }, 0);
    }, []);

    const _content: ListRenderItem<string> = (info: ListRenderItemInfo<string>) => {
        const { item: image, index } = info;
        return (
            <TouchableOpacity
                key={`List-Image-${index + 1}`}
                style={[styles.clickableImg]}
                onPress={() => {
                    if(onImagePress)
                        onImagePress(index)
                }}
                activeOpacity={0.8}
            >
                <Img 
                    imageUrl={image} 
                    style={{ width: ITEM_HEIGHT, height: ITEM_HEIGHT }}
                    />
            </TouchableOpacity>
    
        )
    }
    return (
        <Modal
            isVisible={isVisible}
            onBackButtonPress={closeModal}
            onBackdropPress={closeModal}
            animationIn='slideInUp'
            animationOut={'slideOutDown'}
            swipeDirection={['up','down']}
            onSwipeComplete={({ swipingDirection }) => swipingDirection=='down' && closeModal && closeModal()}
            coverScreen
            style={{ backgroundColor: 'transparent', padding:0 }}
            backdropColor={'#FFFFFF'}
            backdropOpacity={1}
        >
            <FlatList
                ref={flatlistRef}
                data={images}
                keyExtractor={(item) => item}
                renderItem={_content}
                getItemLayout={(data, index) => (
                    { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                )}
                />
        </Modal>
    )
})

type ImageProps = { 
    style?: Object
    imageUrl: string
}

const Img = (props: ImageProps) => {
    const { style: propsStyle, imageUrl } = props;
  
    return (
        <View style={{
            position: 'relative',
            ...propsStyle
        }}>
            <Image 
                source = {{uri: imageUrl}}
                style = {{
                    width: ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    resizeMode: 'contain',
                    backgroundColor: THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY,
                    borderRadius: 2,
                    ...propsStyle
                }}
            />
        </View>
    );
  };
  
const styles = StyleSheet.create({
    extraStyle: {
        paddingRight: 5,
        textAlign: 'right',
      },
      flexBasisHalf: {
        flexBasis: '50%',
      },
      flexOne: {
        flex: 1,
      },
      flexRow: {
        flexDirection: 'row',
      },
      fourImagesInnerView: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      },
      imageContainer: {
        borderRadius: 5,
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
        marginBottom: 1,
        marginTop: 1,
        padding: 2,
      },
      imagesCount: {
        alignSelf: 'center',
        color: '#fff',
        fontSize: 30,
      },
      moreImagesOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 5,
        height: '100%',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 2,
      },
      moreImagesOverlayContainer: {
        height: '100%',
        position: 'relative',
        width: '100%',
      },
      moreThanFourImagesInnerView: {
        flex: 1,
        flexDirection: 'row',
        height: '50%',
      },
      titleStyle: {
        fontSize: 16,
        paddingLeft: 5,
      },
      caption: {
        color: 'black',
        fontSize: 15,
        paddingLeft: 4,
        paddingTop: 2,
      },
      container: {
        backgroundColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
        borderRadius: 10,
        position: 'relative',
        alignSelf: "center"
      },
      overlay: {
        aspectRatio: 1,
        borderRadius: 5,
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
      },
      clickableImg: {
        marginBottom: 5,
        padding: 3,
      },
    
    
});