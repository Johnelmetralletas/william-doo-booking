// Entry point.
//
// The form is rendered as template-string HTML with inline on* handlers
// (onclick="goNext()", ondragstart="fpDragStart(...)", etc). Those resolve
// against the global scope at click time, so every module's exported functions
// are copied onto window below. This keeps the original markup untouched while
// the code itself lives in proper ES modules.

import './styles/main.css';

import { CONFIG } from './config.js';
import * as constants from './constants.js';
import * as utils from './utils.js';
import * as steps from './steps.js';
import * as floorplan from './floorplan.js';
import * as form from './form.js';
import * as landing from './landing.js';
import * as backend from './backend.js';

// Expose every handler used by inline on* attributes on the global object.
Object.assign(window, constants, utils, steps, floorplan, form, landing, backend);

// EmailJS is loaded as a classic <script> in index.html, so it's a global.
if (window.emailjs && CONFIG.EMAILJS_PUBLIC_KEY) {
  window.emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
}
