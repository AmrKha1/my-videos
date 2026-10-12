import {Config} from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('png'); // lossless frames → no JPEG artifacts before the H.264 encode
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
Config.setConcurrency(4);
Config.setChromiumOpenGlRenderer('swangle');
