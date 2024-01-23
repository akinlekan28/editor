import { View, Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons, FontAwesome6, Feather, AntDesign } from '@expo/vector-icons';

type Props = {
  trashEditing: () => void;
  download: () => void;
  addWatermark: () => void;
  increaseSpeed: () => void;
};

const PresetTwo: React.FC<Props> = ({
  trashEditing,
  download,
  addWatermark,
  increaseSpeed,
}) => {
  return (
    <View style={styles.editCard}>
      <Pressable style={styles.attachedMusic} onPress={trashEditing}>
        <FontAwesome6 name="trash" size={19} color="red" />
      </Pressable>
      <Pressable style={styles.attachedMusic} onPress={download}>
        <Feather name="share-2" size={24} color="#05BCEE" />
      </Pressable>
      <Pressable style={styles.attachedMusic} onPress={addWatermark}>
        <Ionicons name="water" size={24} color="#392467" />
      </Pressable>
      <Pressable style={styles.attachedMusic} onPress={increaseSpeed}>
        <AntDesign name="forward" size={24} color="#52D3D8" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  attachedMusic: {
    alignItems: 'center',
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  editCard: {
    position: 'absolute',
    right: 10,
    top: 60,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 30,
    marginTop: 5,
    flexDirection: 'column',
  },
});

export default PresetTwo;
