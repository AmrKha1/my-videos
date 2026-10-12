import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {FPS, H, W} from './theme';
import {VO_DURATION} from './cues';
import {Main} from './Main';
import {Lab} from './Lab';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.ceil(VO_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="Lab" component={Lab} durationInFrames={60} fps={FPS} width={W} height={H} />
  </>
);
