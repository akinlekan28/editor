import { View, Pressable, StyleSheet } from 'react-native';
import React from 'react';
import { Ionicons, FontAwesome6, Entypo, AntDesign } from '@expo/vector-icons';

type Props = {
  trashEditing: () => void;
  pickMusic: () => void;
  openPicker: () => void;
  increaseSpeed: () => void;
  cutVideoSegment: () => void;
};

const PresetOne: React.FC<Props> = ({
  trashEditing,
  pickMusic,
  openPicker,
  increaseSpeed,
  cutVideoSegment,
}) => {
  return (
    <View style={styles.editCard}>
      <Pressable style={styles.attachedMusic} onPress={trashEditing}>
        <FontAwesome6 name="trash" size={19} color="red" />
      </Pressable>

      <Pressable style={styles.attachedMusic} onPress={pickMusic}>
        <Ionicons name="musical-notes" size={24} color="#0B60B0" />
      </Pressable>
      <Pressable style={styles.attachedMusic} onPress={openPicker}>
        <Entypo name="video" size={24} color="#A535B7" />
      </Pressable>
      <Pressable style={styles.attachedMusic} onPress={increaseSpeed}>
        <AntDesign name="forward" size={24} color="#52D3D8" />
      </Pressable>

      <Pressable style={styles.attachedMusic} onPress={cutVideoSegment}>
        <Ionicons name="cut" size={28} color="#FF9800" />
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

export default PresetOne;
