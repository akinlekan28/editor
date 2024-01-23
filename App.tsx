import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import FFmpegWrapper from '@/lib/FFmpegWrapper';
import DocumentPicker from 'react-native-document-picker';
import { shareFile, deleteFile, deleteAllVideoFiles, writeFile } from '@/utils';
import {
  SCREEN_HEIGHT,
  FRAME_PER_SEC,
  TILE_WIDTH,
  DURATION_WINDOW_WIDTH,
  POPLINE_POSITION,
  FRAME_STATUS,
} from './src/utils/Constants';
import Controls from '@/components/Controls';
import Scrubber, { Frame } from '@/components/Scrubber';
import PresetOne from '@/components/PresetOne';
import PresetTwo from '@/components/PresetTwo';
import PhotoBox from '@/components/PhotoBox';

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
  const [originalPath, setOriginalPath] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [selectedPictures, setSelectedPictures] = useState([]);

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
    }
    setLoading(false);
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
    const scrollOffset = nativeEvent.contentOffset.x;
    const playbackTime = getPopLinePlayTime(scrollOffset);
    const totalScrubberWidth = TILE_WIDTH * frames.length;
    const videoDuration = selectedVideo.duration;
    const scrubberDurationPerPixel = videoDuration / totalScrubberWidth;
    const calculatedStartTime = scrubberDurationPerPixel * scrollOffset;
    video?.current?.seek(playbackTime);
    setStartTime(calculatedStartTime);
    setFramesLineOffset(scrollOffset);
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
        setOriginalPath(`file://${filePath}`);
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

  const increaseSpeed = () => {
    FFmpegWrapper.speed2x(
      selectedVideo.fileName,
      selectedVideo.uri,
      (filePath) => {
        setConvertedAsset(filePath);
        setMuted(false);
        setClipSelected(`file://${filePath}`);
        setOriginalPath(`file://${filePath}`);
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

  const cutVideoSegment = () => {
    let duration = 30;
    if (startTime + duration > selectedVideo.duration) {
      duration = selectedVideo.duration - startTime;
    }

    FFmpegWrapper.cutSegment(
      selectedVideo.fileName,
      selectedVideo.uri,
      startTime.toFixed(2),
      duration.toFixed(2),
      (filePath) => {
        setConvertedAsset(filePath);
        setMuted(false);
        setClipSelected(`file://${filePath}`);
        setOriginalPath(`file://${filePath}`);
      },
      (error) => {
        console.error('Failed to cut segment:', error);
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
    await deleteFile(originalPath);
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
        originalPath,
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

  const loadPictures = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      assetRepresentationMode: 'current',
      quality: 0.7,
      selectionLimit: 7,
    });

    if (result?.assets !== undefined) {
      const { assets } = result;
      setSelectedPictures(assets);
      const displayDuration = 2;
      const fileListContent = assets
        .map((image) => `file '${image.uri}'\nduration ${displayDuration}`)
        .join('\n');
      await writeFile(fileListContent);
    }
  };

  const createSlideShow = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.audio,
      });
      if (result?.uri !== null || result?.uri !== undefined) {
        setMuted(true);
        FFmpegWrapper.createSlideShow(
          result?.uri,
          (filePath) => {
            setSelectedVideo({ uri: `file://${filePath}` });
            setConvertedAsset(filePath);
            setMuted(false);
            setClipSelected(`file://${filePath}`);
            setSelectedPictures([]);
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
    } catch (error) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.wrapper}>
        <Text style={styles.mainText}>Azzuu Demo</Text>
        <View style={styles.canvasLayout}>
          <View
            style={
              selectedVideo == null || selectedPictures.length == 0
                ? styles.pickerContainer
                : {}
            }
          >
            {selectedVideo == null ? (
              <>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : selectedPictures.length > 0 ? null : (
                  <View style={styles.row}>
                    <Pressable
                      style={styles.pickerButton}
                      onPress={() => openPicker()}
                    >
                      <Text style={styles.buttonText}>Select a video</Text>
                    </Pressable>
                    <View style={{ marginHorizontal: 8 }} />
                    <Pressable
                      style={styles.pickerButton}
                      onPress={() => loadPictures()}
                    >
                      <Text style={styles.buttonText}>Select photos</Text>
                    </Pressable>
                  </View>
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

            <PhotoBox
              selectedPictures={selectedPictures}
              onPress={() => createSlideShow()}
            />
          </View>
        </View>
        {selectedVideo && (
          <>
            {selectedVideo !== null && convertedAsset == null ? (
              <PresetOne
                trashEditing={() => trashEditing(false)}
                pickMusic={() => pickMusic()}
                openPicker={() => openPicker()}
                increaseSpeed={() => increaseSpeed()}
                cutVideoSegment={() => cutVideoSegment()}
              />
            ) : (
              <PresetTwo
                trashEditing={() => trashEditing(false)}
                download={() => download()}
                addWatermark={() => addWatermark()}
                increaseSpeed={() => increaseSpeed()}
              />
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
  buttonText: {
    color: '#fff',
    fontSize: 15,
  },
  video: {
    height: 0.5 * SCREEN_HEIGHT,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
});
