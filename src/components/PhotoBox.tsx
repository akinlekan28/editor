import { View, Image, Pressable } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  selectedPictures?: any;
  onPress: () => void;
};

const PhotoBox: React.FC<Props> = ({ selectedPictures, onPress }) => {
  return (
    <View>
      {selectedPictures.length > 0 ? (
        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {selectedPictures.map((data, index) => (
              <Image
                key={index}
                source={{ uri: data.uri }}
                style={{
                  width: 80,
                  height: 80,
                  margin: 10,
                }}
              />
            ))}
          </View>
          <Pressable
            onPress={onPress}
            style={{
              alignSelf: 'center',
              backgroundColor: '#3887BE',
              paddingVertical: 5,
              paddingHorizontal: 26,
              borderRadius: 6,
            }}
          >
            <Ionicons name="ticket" size={24} color="#fff" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

export default PhotoBox;
