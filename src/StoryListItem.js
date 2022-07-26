import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Animated,
    Dimensions, Image,
    Platform,
    SafeAreaView, StyleSheet, Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    StatusBar
} from "react-native";
import { Path, Svg } from "react-native-svg";
import GestureRecognizer from 'react-native-swipe-gestures';
import Video from 'react-native-video';
import { usePrevious } from "./helpers/StateHelpers";
import { isNullOrWhitespace } from "./helpers/ValidationHelpers";
import type { IUserStoryItem } from "./interfaces/IUserStory";

const { width, height } = Dimensions.get('window');

type Props = {
    profileName: string,
    profileImage: string,
    duration?: number,
    onFinish?: function,
    onClosePress: function,
    key: number,
    swipeText?: string,
    customSwipeUpComponent?: any,
    customCloseComponent?: any,
    stories: IUserStoryItem[]
};

function timeSince(date) {
    var seconds = Math.floor((new Date() - new Date(date)) / 1000);

    var interval = seconds / 31536000;

    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + " h";
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + " m";
    }
    return Math.floor(seconds) + " s";
}

export const StoryListItem = (props: Props) => {
    const stories = props.stories;

    const [load, setLoad] = useState(false);
    const [paused, setPaused] = useState(false);
    const [duration, setDuration] = useState(props.duration);
    const [content, setContent] = useState(
        stories.map((x) => {
            var type = "image";

            if (x.story_video !== undefined) {
                type = "video";
            }

            return {
                type: type,
                date: timeSince(x.date),
                media: type == "video" ? x.story_video : x.story_image,
                onPress: x.onPress,
                swipeText: x.swipeText,
                finish: 0
            }
        }));

    const [current, setCurrent] = useState(0);

    const progress = useRef(new Animated.Value(0)).current;
    const playerRef = useRef(null);

    useEffect(() => {
        if (props.currentPage === props.index) {
            setCurrent(0);
    
            let data = [...content];
            data.map((x, i) => {
                x.finish = 0;
            })
            setContent(data);
            start();
        } else {
            setPaused(true);
        }
    }, [props.currentPage]);

    const prevCurrent = usePrevious(current);

    useEffect(() => {
        if (!isNullOrWhitespace(prevCurrent)) {
            if (current > prevCurrent && content[current - 1].media == content[current].media) {
                start();
            } else if (current < prevCurrent && content[current + 1].media == content[current].media) {
                start();
            }
        }

    }, [current]);

    useEffect(() => {
        if (!load && props.currentPage === props.index) {
            start()
        }
    }, [load, props.currentPage])

    function start(d = duration) {
        setLoad(false);
        setPaused(false);
        progress.setValue(0);
        playerRef?.current?.seek(0);
        startAnimation(d);
    }

    function startAnimation(dr) {
        Animated.timing(progress, {
            toValue: 1,
            duration: dr,
            useNativeDriver: false
        }).start(({ finished }) => {
            if (finished) {
                setPaused(true);
                next();
            }
        });
    }

    function onSwipeUp() {
        if (props.onClosePress) {
            props.onClosePress();
        }
        if (content[current].onPress) {
            content[current].onPress();
        }
    }

    function onSwipeDown() {
        props?.onClosePress();
    }

    const config = {
        velocityThreshold: 0.3,
        directionalOffsetThreshold: 80
    };

    function next() {
        // check if the next content is not empty
        setLoad(true);
        if (current !== content.length - 1) {
            let data = [...content];
            data[current].finish = 1;
            setContent(data);
            setCurrent(current + 1);
            progress.setValue(0);
        } else {
            // the next content is empty
            close('next');
        }
    }

    function previous() {
        // checking if the previous content is not empty
        setLoad(true);
        if (current - 1 >= 0) {
            let data = [...content];
            data[current].finish = 0;
            setContent(data);
            setCurrent(current - 1);
            progress.setValue(0);
        } else {
            // the previous content is empty
            close('previous');
        }
    }

    function close(state) {
        let data = [...content];
        data.map(x => x.finish = 0);
        setContent(data);
        progress.setValue(0);
        if (props.currentPage == props.index) {
            if (props.onFinish) {
                props.onFinish(state);
            }
        }
    }

    const swipeText = content?.[current]?.swipeText || props.swipeText || 'Swipe Up';

    return (
        <GestureRecognizer
            onSwipeUp={(state) => onSwipeUp(state)}
            onSwipeDown={(state) => onSwipeDown(state)}
            config={config}
            style={{
                flex: 1,
                backgroundColor: 'black'
            }}
        >
            <StatusBar backgroundColor={"black"} />
            <SafeAreaView>
                <View style={styles.backgroundContainer}>
                    {load && <View style={styles.spinnerContainer}>
                        <ActivityIndicator size="large" color={'white'} />
                    </View>}
                    {
                        content[current].type == "video" ? (
                            <Video
                                ref={playerRef}
                                source={{ uri: content[current].media }}
                                rate={1.0}
                                volume={1.0}
                                paused={paused}
                                resizeMode="contain"
                                playInBackground={false}
                                onLoadStart={() => {
                                    setLoad(true);
                                    progress.setValue(0);
                                }}
                                onLoad={(vidData) => {
                                    setLoad(false);
                                    if (vidData.duration !== undefined) {
                                        const d = Math.round(vidData.duration) * 1000;
                                        setDuration(d);
                                    }
                                }}

                                style={{
                                    width: width,
                                    height: height,
                                }}
                            />) : (<Image onLoadEnd={() => {
                                setDuration(props.duration);
                                start();
                            }}
                                source={{ uri: content[current].media }}
                                style={styles.image}
                            />)
                    }
                </View>
            </SafeAreaView>
            <View style={{ flexDirection: 'column', flex: 1, }}>
                <View style={styles.animationBarContainer}>
                    {content.map((index, key) => {
                        return (
                            <View key={key} style={styles.animationBackground}>
                                <Animated.View
                                    style={{
                                        flex: current == key ? progress : content[key].finish,
                                        height: 2,
                                        backgroundColor: 'white',
                                    }}
                                />
                            </View>
                        );
                    })}
                </View>
                <View style={styles.userContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image style={styles.avatarImage}
                            source={{ uri: props.profileImage }}
                        />
                        <Text style={styles.avatarText}>{props.profileName}</Text>
                        <Text style={styles.date}>{content[current].date}</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                        if (props.onClosePress) {
                            props.onClosePress();
                        }
                    }}>
                        <View style={styles.closeIconContainer}>
                            {props.customCloseComponent ?
                                props.customCloseComponent :
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path d="M18 6L6 18" stroke={"white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <Path d="M6 6L18 18" stroke={"white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                            }
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.pressContainer}>
                    <TouchableWithoutFeedback
                        onPressIn={() => progress.stopAnimation()}
                        onLongPress={() => setPaused(true)}
                        onPressOut={() => {
                            setPaused(false);
                            startAnimation(duration);
                        }}
                        onPress={() => {
                            if (!paused && !load) {
                                previous()
                            }
                        }}
                    >
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPressIn={() => progress.stopAnimation()}
                        onLongPress={() => setPaused(true)}
                        onPressOut={() => {
                            setPaused(false);
                            startAnimation(duration);
                        }}
                        onPress={() => {
                            if (!paused && !load) {
                                next()
                            }
                        }}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>
                </View>
            </View>
            {content[current].onPress &&
                <TouchableOpacity activeOpacity={1}
                    onPress={onSwipeUp}
                    style={styles.swipeUpBtn}>
                    {props.customSwipeUpComponent ?
                        props.customSwipeUpComponent :
                        <>
                            <Text style={{ color: 'white', marginTop: 5 }}></Text>
                            <Text style={{ color: 'white', marginTop: 5 }}>{swipeText}</Text>
                        </>
                    }
                </TouchableOpacity>}
        </GestureRecognizer>
    )
}


export default StoryListItem;

StoryListItem.defaultProps = {
    duration: 10000
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        width: width,
        height: height,
        resizeMode: 'cover'
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    spinnerContainer: {
        zIndex: -100,
        position: "absolute",
        justifyContent: 'center',
        backgroundColor: 'black',
        alignSelf: 'center',
        width: width,
        height: height,
    },
    animationBarContainer: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingHorizontal: 10,
        backgroundColor: "rgba(84, 84, 84, 0.2)",
    },
    animationBackground: {
        height: 2,
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(117, 117, 117, 0.5)',
        marginHorizontal: 2,
    },
    userContainer: {
        height: 45,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        backgroundColor: "rgba(84, 84, 84, 0.2)",
    },
    avatarImage: {
        height: 30,
        width: 30,
        borderRadius: 100
    },
    avatarText: {
        fontWeight: 'bold',
        color: 'white',
        paddingLeft: 10,
    },
    date: {
        color: '#F6F6F6',
        paddingLeft: 8,
    },
    closeIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        paddingHorizontal: 15,
    },
    pressContainer: {
        flex: 1,
        flexDirection: 'row'
    },
    swipeUpBtn: {
        position: 'absolute',
        right: 0,
        left: 0,
        alignItems: 'center',
        bottom: Platform.OS == 'ios' ? 20 : 50
    },
    videoSpinnerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
