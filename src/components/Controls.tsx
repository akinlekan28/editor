import { View, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { FontAwesome5, Octicons } from '@expo/vector-icons';

type Props = {
  paused: boolean;
  muted: boolean;
  onPaused: () => void;
  onMuted: () => void;
};

const Controls: React.FC<Props> = ({ paused, muted, onPaused, onMuted }) => {
  return (
    <View style={styles.control}>
      <Pressable onPress={() => onPaused()}>
        <FontAwesome5 name={paused ? 'play' : 'pause'} size={24} color="#fff" />
      </Pressable>
      <View style={{ marginHorizontal: 10 }} />
      <Pressable onPress={() => onMuted()}>
        <Octicons name={muted ? 'unmute' : 'mute'} size={24} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  control: {
    backgroundColor: '#3D3B40',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 6,
    margin: 20,
    flexDirection: 'row',
    alignSelf: 'center',
  },
});

export default Controls;
