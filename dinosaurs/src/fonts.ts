// Local fonts (Fontsource packages, bundled by webpack — no network at render time).
import '@fontsource/fraunces/500.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import {continueRender, delayRender} from 'remotion';

const handle = delayRender('Loading fonts');
Promise.all(
  ['500 40px Fraunces', '600 40px Fraunces', '700 40px Fraunces', 'italic 600 40px Fraunces', '500 20px Inter', '600 20px Inter', '700 20px Inter'].map((f) =>
    document.fonts.load(f)
  )
)
  .then(() => continueRender(handle))
  .catch(() => continueRender(handle));
