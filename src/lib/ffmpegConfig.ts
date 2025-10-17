import { FFmpeggy } from 'ffmpeggy';
import which from 'which';

FFmpeggy.DefaultConfig = {
    ...FFmpeggy.DefaultConfig,
    ffmpegBin: which.sync('ffmpeg'),
    ffprobeBin: which.sync('ffprobe'),
};

export { FFmpeggy };
