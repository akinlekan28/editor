import {
  FFmpegKit,
  FFmpegKitConfig,
  ReturnCode,
} from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import { FRAME_PER_SEC, FRAME_WIDTH } from '../utils/Constants';

class FFmpegWrapper {
  static getFrames(
    fileName,
    videoURI,
    frameNumber,
    successCallback,
    errorCallback,
    onFrameGenerated
  ) {
    let outputImagePath = `${RNFS.CachesDirectoryPath}/${fileName}_%4d.png`;
    const ffmpegCommand = `-ss 0 -i ${videoURI} -vf "fps=${FRAME_PER_SEC}/1:round=up,scale=${FRAME_WIDTH}:-2" -vframes ${frameNumber} ${outputImagePath}`;

    FFmpegKit.executeAsync(
      ffmpegCommand,
      async (session) => {
        const state = FFmpegKitConfig.sessionStateToString(
          await session.getState()
        );
        const returnCode = await session.getReturnCode();
        const failStackTrace = await session.getFailStackTrace();
        const duration = await session.getDuration();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log(
            `Encode completed successfully in ${duration} milliseconds;.`
          );
          successCallback(outputImagePath);
        } else {
          console.log('Encode failed. Please check log for the details.');
          console.log(
            `Encode failed with state ${state} and rc ${returnCode}.${
              (failStackTrace, '\\n')
            }`
          );
          errorCallback();
        }
      },
      (log) => {},
      (statistics) => {
        const processedFrames = statistics.getVideoFrameNumber();
        const frameUri = `${outputImagePath.replace(
          '%4d',
          String(processedFrames).padStart(4, '0')
        )}`;
        onFrameGenerated(frameUri, processedFrames, frameNumber);
      }
    ).then((session) =>
      console.log(
        `Async FFmpeg process started with sessionId ${session.getSessionId()}.`
      )
    );
  }

  static attachAudio(
    fileName,
    videoURI,
    videoDuration,
    audioURI,
    successCallback,
    errorCallback,
    progressCallback
  ) {
    let outputVideoPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

    const ffmpegCommand = `-i ${videoURI} -i ${audioURI} -filter_complex "[1:a]atrim=duration=${videoDuration}[trimmedAudio]" -map 0:v -map "[trimmedAudio]" -c:v copy -c:a aac -shortest ${outputVideoPath}`;

    FFmpegKit.executeAsync(
      ffmpegCommand,
      async (session) => {
        const state = FFmpegKitConfig.sessionStateToString(
          await session.getState()
        );
        const returnCode = await session.getReturnCode();
        const failStackTrace = await session.getFailStackTrace();
        const duration = await session.getDuration();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log(
            `Encode completed successfully in ${duration} milliseconds.`
          );
          successCallback(outputVideoPath);
        } else {
          console.log('Encode failed. Please check log for the details.');
          console.log(
            `Encode failed with state ${state} and rc ${returnCode}. \n${failStackTrace}`
          );
          errorCallback();
        }
      },
      (log) => {
        console.log(log.getMessage());
      },
      (statistics) => {
        const time = statistics.getTime();
        progressCallback(time);
      }
    ).then((session) =>
      console.log(
        `Async FFmpeg process started with sessionId ${session.getSessionId()}.`
      )
    );
  }

  static addWatermark(
    fileName,
    videoURI,
    watermarkURI,
    successCallback,
    errorCallback,
    progressCallback
  ) {
    const uniqueSuffix = Date.now();
    let outputVideoPath = `${RNFS.CachesDirectoryPath}/${
      uniqueSuffix + fileName
    }`;

    const ffmpegCommand = `-y -i ${videoURI} -i ${watermarkURI} -filter_complex "[1][0]scale2ref=oh*mdar:ih*0.2[logo][video];[video][logo]overlay=(main_w-overlay_w):(main_h-overlay_h)" ${outputVideoPath}`;

    FFmpegKit.executeAsync(
      ffmpegCommand,
      async (session) => {
        const state = FFmpegKitConfig.sessionStateToString(
          await session.getState()
        );
        const returnCode = await session.getReturnCode();
        const failStackTrace = await session.getFailStackTrace();
        const duration = await session.getDuration();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log(
            `Encode completed successfully in ${duration} milliseconds.`
          );
          successCallback(outputVideoPath);
        } else {
          console.log('Encode failed. Please check log for the details.');
          console.log(
            `Encode failed with state ${state} and rc ${returnCode}. \n${failStackTrace}`
          );
          errorCallback();
        }
      },
      (log) => {
        console.log(log.getMessage());
      },
      (statistics) => {
        const time = statistics.getTime();
        progressCallback(time);
      }
    ).then((session) =>
      console.log(
        `Async FFmpeg process started with sessionId ${session.getSessionId()}.`
      )
    );
  }
}

export default FFmpegWrapper;
