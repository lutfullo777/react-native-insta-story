import React from "react";
import {View, FlatList} from "react-native";
import StoryCircleListItem from "./StoryCircleListItem";

const StoryCircleListView = (props) => {

    const {
        data,
        handleStoryItemPress,
        unPressedBorderColor,
        pressedBorderColor,
        avatarSize,
        showText,
        textStyle
    } = props;

    return (
        <View>
            <FlatList
                keyExtractor={(item, index) => index.toString()}
                data={data}
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={<View style={{ flex: 1, width: 8 }} />}
                renderItem={({ item, index }) => (
                    <StoryCircleListItem
                        avatarSize={avatarSize}
                        handleStoryItemPress={() =>
                            handleStoryItemPress && handleStoryItemPress(item, index)
                        }
                        index={index}
                        listLength={data.length}
                        unPressedBorderColor={unPressedBorderColor}
                        pressedBorderColor={pressedBorderColor}
                        item={item}
                        showText={showText}
                        textStyle={textStyle}
                    />
                )}
            />
        </View>
    );

}

export default StoryCircleListView;
