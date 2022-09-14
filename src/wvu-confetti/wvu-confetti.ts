import { html, LitElement } from 'lit';
import { state, query, property, customElement } from 'lit/decorators';
import ConfettiGenerator from 'confetti-js';

import style from './wvu-confetti.css';

interface ConfettiGenerator {
  target: HTMLCanvasElement
  max?: number;
  size?:number;
  animate?: boolean;
  respawn?: boolean;
  props?: [];
  colors?: [];
  clock?: number;
  interval?: number;
  rotate?: boolean;
  start_from_edge?: boolean;
  width?: number;
  height?: number;
  clear():void;
  render():void;
}

@customElement('wvu-confetti')
export class WvuConfetti extends LitElement {
  static version = '{{version}}';

  static styles = [style];

  @query('canvas') _canvas!: HTMLElement;

  @property({ reflect: true }) max = 80;

  @property({ reflect: true }) size = 1;

  @property({ reflect: true, type: Boolean }) animation = true;

  @property({ reflect: true, type: Boolean }) respawn = true;

  @property({ reflect: true, type: Array }) shapes: string[] = [
    'circle',
    'square',
    'triangle',
    'line',
  ];

  @property({ reflect: true, type: Array }) colors = [
    [0, 40, 85],
    [234, 170, 0],
  ];

  @property({ reflect: true }) clock = 25;

  @property({ reflect: true }) interval = null;

  @property({ reflect: true }) rotate = false;

  @property({ reflect: true, type: Boolean }) edge = false;

  @state() private _width = window.innerWidth;

  @state() private _height = window.innerHeight;

  private _confetti!: ConfettiGenerator;

  async connectedCallback() {
    super.connectedCallback();

    window.addEventListener('resize', () => {
      this._width = window.innerWidth;
      this._height = window.innerHeight;
      this._confetti.clear();
      this._createConfetti();
    });

    await this.updateComplete;
    this._createConfetti();
  }

  render() {
    return html` <canvas id="canvas"></canvas> `;
  }

  private _createConfetti() {
    const options = {
      target: this._canvas,
      max: this.max,
      size: this.size,
      animate: this.animation,
      respawn: this.respawn,
      props: this.shapes,
      colors: this.colors,
      clock: this.clock,
      interval: this.interval,
      rotate: this.rotate,
      start_from_edge: this.edge,
      width: this._width,
      height: this._height,
    };
    this._confetti = new ConfettiGenerator(options);
    this._confetti.render();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wvu-confetti': WvuConfetti;
  }
}
