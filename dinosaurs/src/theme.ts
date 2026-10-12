// Binly colour tokens for "No photograph of a living T. rex".
// Core values come from color_system.txt; the extra shades are tints/shades
// inside the same families (see STYLE_GUIDE.md for the reasoning).

export const C = {
  // core system
  paper: '#EDE4D3',
  ink: '#2B2420',
  oxblood: '#8B2E1F',
  evidence: '#2F5233', // confirmed / physical evidence
  theory: '#5C4A72', // reconstruction / inference / guess
  caution: '#B8860B', // unplaced, uncertain, "handle with care"

  // paper family
  paperLight: '#F5EFE3',
  paperShade: '#E2D6C0',
  paperDeep: '#D3C4A8',

  // ink family (night interiors, photo emulsion, rock)
  inkSoft: '#3A312B',
  inkLift: '#4A3F37',
  inkMute: '#6B5D50',

  // bone (cream family, slightly warmer)
  bone: '#E6D8BC',
  boneShade: '#CDBB98',

  // earth strata (cream → espresso ramp)
  strata: ['#C9B595', '#B29C79', '#9A8263', '#7D6750', '#5F4E40', '#463A31', '#342B25'],

  // reconstructed T. rex flesh (oxblood family pulled toward brown) + mustard belly
  hide: '#6E3B2A',
  hideDark: '#552C20',
  hideFar: '#4A271D',
  belly: '#B89660',
  scute: '#5A2F22',

  // theory tints for fills behind dashed outlines
  theoryTint: '#8C7BA0',
  theoryWash: '#D8CFDC',

  // skin tone for the 19th-c. figure (light oxblood tint)
  skin: '#D9B49A',
  skinShade: '#C49A7E',

  // lamp light (caution/mustard family, lifted)
  lamp: '#E8C67A',
};

export const FONT_SERIF = '"Fraunces", Georgia, serif';
export const FONT_SANS = '"Inter", "Segoe UI", Arial, sans-serif';

export const W = 1920;
export const H = 1080;
export const FPS = 60;
