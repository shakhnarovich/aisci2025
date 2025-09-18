window.MJ_MACROS = {
  RR: '{\\mathbb{R}}',
  inner: ['\\langle #1,\\,#2\\rangle', 2],
  norm:  ['\\lVert #1\\rVert', 1],
  tanh: '\\operatorname{tanh}',
  argmin: ['\\operatorname*{arg}\\,\\operatorname*{min}\\limits_{#1}', 1],
  argmax: ['\\operatorname*{arg}\\,\\operatorname*{max}\\limits_{#1}', 1],
  vari:['\\operatorname*{var}'],
  va: '{\\mathbf{a}}',
  vb: '{\\mathbf{b}}',
  vc: '{\\mathbf{c}}',
  vd: '{\\mathbf{d}}',
  ve: '{\\mathbf{e}}',
  vf: '{\\mathbf{f}}',
  vh: '{\\mathbf{h}}',
  vk: '{\\mathbf{k}}',
  vl: '{\\mathbf{l}}',
  vm: '{\\mathbf{m}}',
  vn: '{\\mathbf{n}}',
  vp: '{\\mathbf{p}}',
  vq: '{\\mathbf{q}}',
  vr: '{\\mathbf{r}}',
  vs: '{\\mathbf{s}}',
  vt: '{\\mathbf{t}}',
  vu: '{\\mathbf{u}}',
  vv: '{\\mathbf{v}}',
  vw: '{\\mathbf{w}}',
  vx: '{\\mathbf{x}}',
  vy: '{\\mathbf{y}}',
  vz: '{\\mathbf{z}}',
  mW: '{\\mathbf{W}}',
  mA: '{\\mathbf{A}}',
  mB: '{\\mathbf{B}}',
  mX: '{\\mathbf{X}}',
  mY: '{\\mathbf{Y}}',
  ip: ['#1\\cdot #2', 2],
  eucnorm: ['\\left\\| #1\\right\\|', 1],
  pc: ['p\\left( {#1} | {#2} \\right)', 2],
  textcolor: ['{\\color{#1}#2}', 2],
  E:['E\\left[{#1}\\right]',1],
  Ep: ['E_{#1}\\left[#2\\right]', 2],
};

// define a set of macros for bold/upright Greek letters
(() => {
  const MJ = window.MJ_MACROS || (window.MJ_MACROS = {});
  // skipping eta since it conflicts with beta
  const lower = ['alpha','beta','gamma','delta','epsilon','zeta','theta','iota','kappa','lambda','mu','nu','xi','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega'];
  const upper = ['Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon','Phi','Psi','Omega'];

  // italic (TeX-style) bold: \balpha, \bGamma, …
  [...lower, ...upper].forEach(n => { MJ['b'+n] = `{\\boldsymbol{\\${n}}}`; });

  // upright (upgreek) bold: \bualpha, \buGamma, …
  lower.forEach(n => { MJ['bu'+n] = `{\\boldsymbol{\\up${n}}}`; });
  ['Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon','Phi','Psi','Omega']
    .forEach(n => { MJ['bu'+n] = `{\\boldsymbol{\\Up${n}}}`; });
})();

