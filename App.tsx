import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import { Ionicons, FontAwesome6, Entypo, Feather } from '@expo/vector-icons';
import FFmpegWrapper from '@/lib/FFmpegWrapper';
import DocumentPicker from 'react-native-document-picker';
import { shareFile, deleteFile, deleteAllVideoFiles } from '@/utils';
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  FRAME_PER_SEC,
  TILE_HEIGHT,
  TILE_WIDTH,
  DURATION_WINDOW_WIDTH,
  POPLINE_POSITION,
  DURATION_WINDOW_BORDER_WIDTH,
  FRAME_STATUS,
} from './src/utils/Constants';
import Controls from '@/components/Controls';
import Scrubber, { Frame } from '@/components/Scrubber';

export default function App() {
  const video = useRef(null);
  const [frames, setFrames] = useState<Frame>();
  const [clipSelected, setClipSelected] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [userScrubbing, setUserScrubbing] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [framesLineOffset, setFramesLineOffset] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [convertedAsset, setConvertedAsset] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const openPicker = async () => {
    setLoading(true);
    setConvertedAsset(null);
    const result = await launchImageLibrary({
      mediaType: 'video',
      videoQuality: 'medium',
      includeExtra: true,
      assetRepresentationMode: 'current',
    });

    if (result?.assets !== undefined) {
      const { assets } = result;
      deleteFrames();
      setSelectedVideo(assets[0]);
      setClipSelected(assets[0].uri);
      setLoading(false);
    }
  };

  const handleVideoUploaded = (videoAssetLoaded) => {
    setMuted(false);
    const numberOfFrames = Math.ceil(videoAssetLoaded.duration);
    const dummyArray: Frame = Array(numberOfFrames).fill({
      status: FRAME_STATUS.LOADING.name.description,
      uri: '',
    });
    setFrames(dummyArray);
    FFmpegWrapper.getFrames(
      selectedVideo.fileName,
      selectedVideo.uri,
      numberOfFrames,
      (filePath) => {
        const _framesURI = [];
        for (let i = 0; i < numberOfFrames; i++) {
          _framesURI.push(
            `${filePath.replace('%4d', String(i + 1).padStart(4, 0))}`
          );
        }
        const _frames = _framesURI.map((_frameURI) => ({
          uri: _frameURI,
          status: FRAME_STATUS.READY.name.description,
        }));
        setFrames(_frames);
      },
      () => {},
      (frameUri, processedFrames, totalFrames) => {
        setFrames((prevFrames) => {
          const newFrames = [...prevFrames];
          newFrames[processedFrames - 1] = {
            uri: frameUri,
            status: FRAME_STATUS.READY.name.description,
          };
          return newFrames;
        });
      }
    );
  };

  const handleOnTouchEnd = () => {
    setPaused(false);
  };
  const handleOnTouchStart = () => {
    setPaused(true);
  };

  const handleOnScroll = ({ nativeEvent }) => {
    const playbackTime = getPopLinePlayTime(nativeEvent.contentOffset.x);
    video?.current?.seek(playbackTime);
    setFramesLineOffset(nativeEvent.contentOffset.x);
    setUserScrubbing(true);
  };

  const getLeftLinePlayTime = (offset) => {
    return offset / (FRAME_PER_SEC * TILE_WIDTH);
  };

  const getRightLinePlayTime = (offset) => {
    return (offset + DURATION_WINDOW_WIDTH) / (FRAME_PER_SEC * TILE_WIDTH);
  };

  const getPopLinePlayTime = (offset) => {
    return (
      (offset + (DURATION_WINDOW_WIDTH * parseFloat(POPLINE_POSITION)) / 100) /
      (FRAME_PER_SEC * TILE_WIDTH)
    );
  };

  const handleOnProgress = ({ currentTime }) => {
    if (
      userScrubbing &&
      currentTime >= getRightLinePlayTime(framesLineOffset)
    ) {
      video?.current?.seek(getLeftLinePlayTime(framesLineOffset));
      setUserScrubbing(false);
    }
  };

  const pickMusic = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.audio,
      });
      if (result?.uri !== null || result?.uri !== undefined) {
        setMuted(true);
        attachBackgroundAudio(result);
      }
    } catch (error) {}
  };

  const attachBackgroundAudio = (data) => {
    FFmpegWrapper.attachAudio(
      selectedVideo.fileName,
      selectedVideo.uri,
      selectedVideo.duration,
      data.uri,
      (filePath) => {
        setConvertedAsset(filePath);
        setMuted(false);
        setClipSelected(`file://${filePath}`);
      },
      (error) => {
        console.log('error', error);
      },
      (time) => {
        const progressPercentage = Math.min(
          (time / (selectedVideo.duration * 1000)) * 100,
          100
        );
        setProgress(progressPercentage);
      }
    );
  };

  const download = async () => {
    await shareFile(clipSelected);
  };

  const deleteFrames = () => {
    if (frames !== undefined) {
      frames.forEach((frame) => {
        if (frame.uri) {
          deleteFile('file://' + frame.uri);
        }
      });
      setFrames([]);
    }
  };

  const trashEditing = async (edited: boolean) => {
    if (edited) {
      await deleteFile(clipSelected);
    }
    await deleteAllVideoFiles();
    setSelectedVideo(null);
    setMuted(false);
    setFramesLineOffset(0);
    setClipSelected('');
    deleteFrames();
  };

  const addWatermark = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      assetRepresentationMode: 'current',
    });

    if (result?.assets !== undefined) {
      const { assets } = result;

      FFmpegWrapper.addWatermark(
        selectedVideo.fileName,
        convertedAsset,
        assets[0].uri,
        (filePath) => {
          setConvertedAsset(filePath);
          setMuted(false);
          setClipSelected(`file://${filePath}`);
        },
        (error) => {
          console.log('error', error);
        },
        (time) => {
          const progressPercentage = Math.min(
            (time / (selectedVideo.duration * 1000)) * 100,
            100
          );
          setProgress(progressPercentage);
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.wrapper}>
        <Text style={styles.mainText}>Azzuu Demo</Text>
        <View style={styles.canvasLayout}>
          <View style={selectedVideo == null ? styles.pickerContainer : {}}>
            {selectedVideo == null ? (
              <>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Pressable
                    style={styles.pickerButton}
                    onPress={() => openPicker()}
                  >
                    <Text style={styles.buttonText}>Select a video</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <Video
                  ref={video}
                  key={clipSelected}
                  ignoreSilentSwitch="ignore"
                  style={styles.video}
                  source={{
                    uri:
                      convertedAsset == null
                        ? selectedVideo.uri
                        : `file://${convertedAsset}`,
                  }}
                  resizeMode={'contain'}
                  repeat={true}
                  muted={muted}
                  paused={paused}
                  onProgress={
                    convertedAsset == null ? handleOnProgress : () => {}
                  }
                  onLoad={
                    convertedAsset == null ? handleVideoUploaded : () => {}
                  }
                />

                <View style={{ width: '100%', backgroundColor: '#eee' }}>
                  <View
                    style={{
                      width: `${progress}%`,
                      height: 8,
                      backgroundColor: 'green',
                    }}
                  />
                </View>

                {frames && convertedAsset == null && (
                  <Scrubber
                    frames={frames}
                    handleOnScroll={(nativeEvent) =>
                      handleOnScroll(nativeEvent)
                    }
                    handleOnTouchStart={handleOnTouchStart}
                    handleOnTouchEnd={handleOnTouchEnd}
                  />
                )}
              </>
            )}
          </View>
        </View>
        {selectedVideo && (
          <>
            {selectedVideo !== null && convertedAsset == null ? (
              <View style={styles.editCard}>
                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => trashEditing(false)}
                >
                  <FontAwesome6 name="trash" size={19} color="red" />
                </Pressable>

                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => pickMusic()}
                >
                  <Ionicons name="musical-notes" size={24} color="#0B60B0" />
                </Pressable>
                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => openPicker()}
                >
                  <Entypo name="video" size={24} color="#A535B7" />
                </Pressable>
              </View>
            ) : (
              <View style={styles.editCard}>
                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => trashEditing(true)}
                >
                  <FontAwesome6 name="trash" size={19} color="red" />
                </Pressable>
                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => download()}
                >
                  <Feather name="share-2" size={24} color="#05BCEE" />
                </Pressable>
                <Pressable
                  style={styles.attachedMusic}
                  onPress={() => addWatermark()}
                >
                  <Ionicons name="water" size={24} color="#392467" />
                </Pressable>
              </View>
            )}
            <View style={{ marginTop: 70 }} />
            <Controls
              paused={paused}
              muted={muted}
              onPaused={() => setPaused(!paused)}
              onMuted={() => setMuted(!muted)}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainText: {
    fontSize: 20,
    paddingLeft: 20,
    fontWeight: '500',
  },
  wrapper: {
    // padding: 20,
  },
  canvasLayout: {
    marginTop: 30,
    backgroundColor: '#000',
    height: 0.5 * SCREEN_HEIGHT,
    zIndex: 0,
  },
  pickerContainer: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  pickerButton: {
    backgroundColor: '#333333',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  attachedMusic: {
    alignItems: 'center',
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
  },
  video: {
    height: 0.5 * SCREEN_HEIGHT,
    width: '100%',
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
