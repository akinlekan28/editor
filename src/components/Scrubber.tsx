import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import React from 'react';
import {
  SCREEN_WIDTH,
  FRAME_STATUS,
  TILE_HEIGHT,
  TILE_WIDTH,
  DURATION_WINDOW_WIDTH,
  POPLINE_POSITION,
  DURATION_WINDOW_BORDER_WIDTH,
  DURATION_WINDOW_DURATION,
} from '@/utils/Constants';

export type Frame = {
  status: 'READY' | 'LOADING';
  uri: string;
};

type Props = {
  frames: Frame;
  handleOnScroll: (nativeEvent) => void;
  handleOnTouchStart: () => void;
  handleOnTouchEnd: () => void;
};

const Scrubber: React.FC<Props> = ({
  frames,
  handleOnScroll,
  handleOnTouchStart,
  handleOnTouchEnd,
}) => {
  const renderFrame = (frame, index) => {
    if (frame.status === FRAME_STATUS.LOADING.name.description) {
      return <View style={styles.loadingFrame} key={index} />;
    } else {
      return (
        <Image
          key={index}
          source={{ uri: 'file://' + frame.uri }}
          style={{
            width: TILE_WIDTH,
            height: TILE_HEIGHT,
          }}
        />
      );
    }
  };

  return (
    <View style={styles.durationWindowAndFramesLineContainer}>
      <View style={styles.durationWindow}>
        <View style={styles.durationLabelContainer}>
          <Text style={styles.durationLabel}>
            {DURATION_WINDOW_DURATION} sec.
          </Text>
        </View>
      </View>
      <View style={styles.popLineContainer}>
        <View style={styles.popLine} />
      </View>
      <View style={styles.durationWindowLeftBorder} />
      <View style={styles.durationWindowRightBorder} />
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal={true}
        style={styles.framesLine}
        alwaysBounceHorizontal={true}
        scrollEventThrottle={1}
        onScroll={handleOnScroll}
        onTouchStart={handleOnTouchStart}
        onTouchEnd={handleOnTouchEnd}
        onMomentumScrollEnd={handleOnTouchEnd}
      >
        <View style={styles.prependFrame} />
        {frames.map((frame, index) => renderFrame(frame, index))}
        <View style={styles.appendFrame} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  durationWindowAndFramesLineContainer: {
    top: -DURATION_WINDOW_BORDER_WIDTH,
    width: SCREEN_WIDTH,
    height: TILE_HEIGHT + DURATION_WINDOW_BORDER_WIDTH * 2,
    justifyContent: 'center',
    zIndex: 10,
  },
  durationWindow: {
    width: DURATION_WINDOW_WIDTH,
    borderColor: 'yellow',
    borderWidth: DURATION_WINDOW_BORDER_WIDTH,
    borderRadius: 4,
    height: TILE_HEIGHT + DURATION_WINDOW_BORDER_WIDTH * 2,
    alignSelf: 'center',
  },
  durationLabelContainer: {
    backgroundColor: 'yellow',
    alignSelf: 'center',
    top: -26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    zIndex: 30,
  },
  durationLabel: {
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '700',
  },
  popLineContainer: {
    position: 'absolute',
    alignSelf: POPLINE_POSITION === '50%' && 'center',
    zIndex: 25,
  },
  popLine: {
    width: 3,
    height: TILE_HEIGHT,
    backgroundColor: 'yellow',
  },
  durationWindowLeftBorder: {
    position: 'absolute',
    width: DURATION_WINDOW_BORDER_WIDTH,
    alignSelf: 'center',
    height: TILE_HEIGHT + DURATION_WINDOW_BORDER_WIDTH * 2,
    left: SCREEN_WIDTH / 2 - DURATION_WINDOW_WIDTH / 2,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: 'yellow',
    zIndex: 25,
  },
  durationWindowRightBorder: {
    position: 'absolute',
    width: DURATION_WINDOW_BORDER_WIDTH,
    right: SCREEN_WIDTH - SCREEN_WIDTH / 2 - DURATION_WINDOW_WIDTH / 2,
    height: TILE_HEIGHT + DURATION_WINDOW_BORDER_WIDTH * 2,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'yellow',
    zIndex: 25,
  },
  framesLine: {
    width: SCREEN_WIDTH,
    position: 'absolute',
  },
  loadingFrame: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
  },
  prependFrame: {
    width: SCREEN_WIDTH / 2 - DURATION_WINDOW_WIDTH / 2,
  },
  appendFrame: {
    width: SCREEN_WIDTH / 2 - DURATION_WINDOW_WIDTH / 2,
  },
});

export default Scrubber;
