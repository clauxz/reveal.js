/*
 * Copyright (c) 2013, Leap Motion, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Version 0.2.0 - http://js.leapmotion.com/0.2.0/leap.min.js
 * Grab latest versions from http://js.leapmotion.com/
 */

;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var chooseProtocol = require('./protocol').chooseProtocol
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore');

/*
 * Leap Motion integration for Reveal.js.
 * James Sun  [sun16]
 * Rory Hardy [gneatgeek]
 */

(function () {
  var body        = document.body,
      controller  = new Leap.Controller({ enableGestures: true }),
      lastGesture = 0,
      leapConfig  = Reveal.getConfig().leap,
      pointer     = document.createElement( 'div' ),
      config      = {
        autoCenter       : true,      // Center pointer around detected position.
        gestureDelay     : 500,       // How long to delay between gestures.
        naturalSwipe     : true,      // Swipe as if it were a touch screen.
        pointerColor     : '#00aaff', // Default color of the pointer.
        pointerOpacity   : 0.7,       // Default opacity of the pointer.
        pointerSize      : 15,        // Default minimum height/width of the pointer.
        pointerTolerance : 120        // Bigger = slower pointer.
      },
      entered, enteredPosition, now, size, tipPosition; // Other vars we need later, but don't need to redeclare.

      // Merge user defined settings with defaults
      if( leapConfig ) {
        for( key in leapConfig ) {
          config[key] = leapConfig[key];
        }
      }

      pointer.id = 'leap';

      pointer.style.position        = 'absolute';
      pointer.style.visibility      = 'hidden';
      pointer.style.zIndex          = 50;
      pointer.style.opacity         = config.pointerOpacity;
      pointer.style.backgroundColor = config.pointerColor;

      body.appendChild( pointer );

  // Leap's loop
  controller.on( 'frame', function ( frame ) {
    // Timing code to rate limit gesture execution
    now = new Date().getTime();

    // Pointer: 1 to 2 fingers. Strictly one finger works but may cause innaccuracies.
    // The innaccuracies were observed on a development model and may not be an issue with consumer models.
    if( frame.fingers.length > 0 && frame.fingers.length < 3 ) {
      // Invert direction and multiply by 3 for greater effect.
      size = -3 * frame.fingers[0].tipPosition[2];

      if( size < config.pointerSize ) {
        size = config.pointerSize;
      }

      pointer.style.width        = size     + 'px';
      pointer.style.height       = size     + 'px';
      pointer.style.borderRadius = size - 5 + 'px';
      pointer.style.visibility   = 'visible';

      if( config.autoCenter ) {
        tipPosition = frame.fingers[0].tipPosition;

        // Check whether the finger has entered the z range of the Leap Motion. Used for the autoCenter option.
        if( !entered ) {
          entered         = true;
          enteredPosition = frame.fingers[0].tipPosition;
        }

        pointer.style.top =
          (-1 * (( tipPosition[1] - enteredPosition[1] ) * body.offsetHeight / config.pointerTolerance )) +
            ( body.offsetHeight / 2 ) + 'px';

        pointer.style.left =
          (( tipPosition[0] - enteredPosition[0] ) * body.offsetWidth / config.pointerTolerance ) +
            ( body.offsetWidth / 2 ) + 'px';
      }
      else {
        pointer.style.top  = ( 1 - (( tipPosition[1] - 50) / config.pointerTolerance )) *
          body.offsetHeight + 'px';

        pointer.style.left = ( tipPosition[0] * body.offsetWidth / config.pointerTolerance ) +
          ( body.offsetWidth / 2 ) + 'px';
      }
    }
    else {
      // Hide pointer on exit
      entered                  = false;
      pointer.style.visibility = 'hidden';
    }

    // Gestures
    if( frame.gestures.length > 0 && (now - lastGesture) > config.gestureDelay ) {
      var gesture = frame.gestures[0];

      // One hand gestures
      if( frame.hands.length === 1 ) {
        // Swipe gestures. 3+ fingers.
        if( frame.fingers.length > 2 && gesture.type === 'swipe' ) {
          // Define here since some gestures will throw undefined for these.
          var x = gesture.direction[0],
              y = gesture.direction[1];

          // Left/right swipe gestures
          if( Math.abs( x ) > Math.abs( y )) {
            if( x > 0 ) {
              config.naturalSwipe ? Reveal.left() : Reveal.right();
            }
            else {
              config.naturalSwipe ? Reveal.right() : Reveal.left();
            }
          }
          // Up/down swipe gestures
          else {
            if( y > 0 ) {
              config.naturalSwipe ? Reveal.down() : Reveal.up();
            }
            else {
              config.naturalSwipe ? Reveal.up() : Reveal.down();
            }
          }

          lastGesture = now;
        }
      }
      // Two hand gestures
      else if( frame.hands.length === 2 ) {
        // Upward two hand swipe gesture
        if( gesture.direction[1] > 0 && gesture.type === 'swipe' ) {
          Reveal.toggleOverview();
        }

        lastGesture = now;
      }
    }
  });

  controller.connect();
})();
