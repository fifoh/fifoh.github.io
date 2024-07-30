// to do:
// work on the 'help' button popup
// test this embedded - does it work?
// does it work on different mobiles?

p5.disableFriendlyErrors = true;
let addButton, removeButton;
let helpButton;
let helpDiv;

let touchMovedOccurred = false;
let previousTouchY;
let touchX, touchY;
let lastState = '';

let angle = 0;

let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);

let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [255,228,209],   // Red
  [203,237,209],   // Green
  [167,234,255]    // Blue
];

let barColors = [];
let clearButton;
let numEllipses = 5;
let preventNoteCreation;
let rectX, rectY, rectWidth, rectHeight;

let randomButton;

// Audio
let audioBuffers = [];
let audioContext;
let bufferLoader;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  let loader = this;
  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          console.error('Error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function(error) {
        console.error('decodeAudioData error for ' + url, error);
      }
    );
  };
  request.onerror = function() {
    console.error('BufferLoader: XHR error for ' + url);
  };
  request.send();
};

BufferLoader.prototype.load = function() {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

function preload() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
  audioContext.suspend().then(() => {
    console.log('AudioContext state in preload:', audioContext.state);
  });  
}

function loadAudioSet(individualInstrumentArray) {
  
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];
  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'bells';
    } else {
      console.error(`Invalid set number ${setNumber} at index ${i}`);
      return;
    }
    let filePath = `${instrumentSet}/${i}.mp3`;
    filePathsToLoad.push(filePath);
    bufferIndicesToLoad.push(i);
  }
  if (filePathsToLoad.length > 0) {
    bufferLoader = new BufferLoader(
      audioContext,
      filePathsToLoad,
      (newBufferList) => finishedLoading(newBufferList, bufferIndicesToLoad)
    );
    bufferLoader.load();
  } else {
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'bells';
    }

    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = '';
      if (setNumber === 1) {
        instrumentSet = 'comb';
      } else if (setNumber === 2) {
        instrumentSet = 'piano';
      } else if (setNumber === 3) {
        instrumentSet = 'bells';
      }
      return `${instrumentSet}/${bufferIndex}.mp3`;
    });
    for (let filePath in loadedInstrumentSetBuffers) {
      if (!filePathsLoaded.includes(filePath)) {
        delete loadedInstrumentSetBuffers[filePath];
      }
    }
  }
}

let majorPentatonic = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 9,
  5: 12,
  6: 14,
  7: 16,
  8: 19,
  9: 21,
  10: 24,
  11: 26,
  12: 28,
  13: 31,
  14: 33,
  15: 36
}

let minorPentatonic = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 10,
  5: 12,
  6: 15,
  7: 17,
  8: 19,
  9: 22,
  10: 24,
  11: 27,
  12: 29,
  13: 31,
  14: 34,
  15: 36
}

let ionian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 23,
  14: 24,
  15: 26
}

let dorian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let mixolydian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let aeolian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 22,
  14: 24,
  15: 26
}

let chromatic = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15
}

let harmonicMinor = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 11,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 23,
  14: 24,
  15: 26
}

let wholeTone = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  13: 26,
  14: 28,
  15: 30
}

let octatonic = {
  0: 0,
  1: 1,
  2: 3,
  3: 4,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 12,
  9: 13,
  10: 15,
  11: 16,
  12: 18,
  13: 19,
  14: 21,
  15: 22
}

let scaleMappings = majorPentatonic;

const ellipseWidth = 0;
let centerY;
let ellipses = [];
let isPlaying = false;
let playStopButton;
let speedSlider;
const minDistance = 5;
let clickProximityX;
let ellipseHeight;
let clickProximityY;
let pointSize;

let buffer;
let textureBuffer;
let textureY = 0;

function setup() {
  
  noScroll();
  
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });
  
  createCanvas(windowWidth, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
  frameRate(60);
    
  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.touchStarted(clearNotes);
  clearButton.position(windowWidth-50, 30);

  // Create the play/stop button
  playStopButton = createImg('images/play_icon.jpg', '▶');
  playStopButton.size(45, 45); 
  playStopButton.position(10, 30); 
  playStopButton.touchStarted(togglePlayStop);
  
  helpButton = createImg('images/help_icon.jpg', '?');
  helpButton.size(45,45);
  helpButton.position(5, windowHeight - 75);
  helpButton.touchStarted(popupHelp);  

  scalesDropdown = createSelect();
  scalesDropdown.option('Select a Scale:', '');
  scalesDropdown.disable('Select a Scale:', '');
  scalesDropdown.option('Major Pentatonic');
  scalesDropdown.option('Minor Pentatonic');
  scalesDropdown.option('Major scale');
  scalesDropdown.option('Dorian mode');
  scalesDropdown.option('Mixolydian mode');
  scalesDropdown.option('Aeolian mode');
  scalesDropdown.option('Chromatic');
  scalesDropdown.option('Harmonic Minor');
  scalesDropdown.option('Whole Tone');
  scalesDropdown.option('Octatonic');
  scalesDropdown.position(windowWidth/2, windowHeight - 25);
  scalesDropdown.changed(changeScale);
  
  instrumentDropdown = createSelect();
  instrumentDropdown.option('Select an Instrument:', '');
  instrumentDropdown.option('Comb');
  instrumentDropdown.option('Piano');
  instrumentDropdown.option('Bells');
  instrumentDropdown.position(10, windowHeight - 25);
  instrumentDropdown.changed(changeInstrument);  
  
  let addButton = createImg('images/plus_band.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);
  addButton.touchStarted(() => {
    if (numEllipses < 15) {
    numEllipses++;
    initializePointsArray();
    }
  });

  let removeButton = createImg('images/minus_band.jpg', '-');
  removeButton.size(45, 45);
  removeButton.position(windowWidth - 60- removeButton.width - addButton.width, 30);
  removeButton.touchStarted(() => {
    if (numEllipses > 5) {
      numEllipses--;
      initializePointsArray();
    }
  });  
  
  randomButton = createImg("images/random_button.jpg", "R")
  randomButton.size(45, 45);
  randomButton.touchStarted(randomiseEverything);
  positionrandomButton();    

  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(65, 30);
  
  let sliderWrapper = select('.slider-wrapper');
  speedSlider = createSlider(0.01, 0.03, 0.01, 0.001);
  speedSlider.position(65 + metroImage.width, 40);
  speedSlider.parent(sliderWrapper);
  speedSlider.style('width', '90px');
  
  createEllipses();
  
  for (let i = 0; i < numEllipses; i++) {
    barColors[i] = color(0, 60);
  }  
  
  buffer = createGraphics(width, height);
  buffer.background(250);
  buffer.fill(180, 180, 180, 80);
  buffer.noStroke();
  buffer.rect(windowWidth*0.05, windowHeight*0.36, windowWidth *0.89, windowHeight*0.476, 10);
  
  buffer.stroke(0, 50);
  buffer.strokeWeight(3);
  buffer.noFill();
  buffer.rect(0, 0, windowWidth, windowHeight);
  
  let rectWidth = windowWidth * 0.89;
  let rectHeight = windowHeight * 0.476;
  
  textureBuffer = createGraphics(rectWidth, rectHeight);
  let rectX = windowWidth * 0.05;
  let rectY = windowHeight * 0.36;
  textureBuffer.noStroke();
  
  initializePointsArray();
}

function draw() {
  background(255);
  image(buffer, 0, 0);
  
  let rectX = windowWidth * 0.05;
  let rectY = windowHeight * 0.36;
  let rectWidth = windowWidth * 0.89;
  let rectHeight = windowHeight * 0.476;  
  
  centerY = rectY + rectHeight / 2;
  let xBarOffset = 18;
  let yBarOffset = 0;

  if (isPlaying) {
    textureY -= speedSlider.value() * 140;
    if (textureY <= -textureBuffer.height) {
      textureY += textureBuffer.height;
    }
  }

  textureBuffer.clear();
  textureBuffer.fill(0, 0, 0, 2);
  for (let y = textureY % 20; y < textureBuffer.height + 20; y += 20) {
    textureBuffer.rect(0, y, textureBuffer.width, 5);
  }
  push();
  translate(windowWidth * 0.05, windowHeight * 0.36);
  copy(textureBuffer, 0, 0, round(textureBuffer.width), round(textureBuffer.height), 0, 0, round(textureBuffer.width), round(textureBuffer.height));
  pop();

  let firstEllipseX = windowWidth * 0.12;
  let spacing = (windowWidth - firstEllipseX * 2) / (numEllipses - 1);
  
  for (let i = 0; i < numEllipses; i++) {
    let ellipseData = ellipses[i];
    ellipseData.centerX = firstEllipseX + spacing * i;
  }  
  
  let bar_thickness = 6;
  for (let i = 0; i < numEllipses; i++) {
    stroke(barColors[i]);
    strokeWeight(bar_thickness);
    let startX = ellipses[i].centerX;
    let startY = windowHeight * 0.335;
    let endX = startX;
    let endY = startY - windowHeight*0.15 + i*4.8;
    line(startX, startY, endX, endY);
    
    let buttonSize = 20;
    let buttonX = startX;
    let buttonY = endY;
    ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
    
    let originalIndex = scaleMappings[i];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    
    fill(ellipseColors[colIndex]);
    stroke(barColors[i]);
    strokeWeight(0);
    ellipse(buttonX, buttonY, buttonSize, buttonSize);         

    
  }  
  for (let i = 0; i < ellipses.length; i++) {
    let ellipseData = ellipses[i];
    ellipseData.centerX = firstEllipseX + spacing * i;
    ellipseData.centerY = centerY;
    noFill();
    noStroke();
    ellipse(ellipseData.centerX, centerY, ellipseWidth, ellipseHeight);
    pointSize = windowWidth * 0.4 / numEllipses;
    for (let j = ellipseData.points.length - 1; j >= 0; j--) {
      let band_point = ellipseData.points[j];
      let { angle } = band_point;
      let pointX = ellipseData.centerX + ellipseWidth / 2 * Math.cos(angle);
      let pointY = centerY + ellipseHeight / 2 * Math.sin(angle);
      let verticalSize = map(pow(abs(Math.sin(angle)), 10), 0, 1, 5, 15);

      let adjustment = -2.5;

      let alpha;
      if (angle > HALF_PI + adjustment && angle < PI + HALF_PI - adjustment) {
        if (angle < PI) {
          alpha = map(angle, HALF_PI + adjustment, PI, -25, 255);
        } else {
          alpha = map(angle, PI, PI + HALF_PI - adjustment, 255, -25);
        }
      } else {
        alpha = 0;
      }
      fill(0, 0, 0, alpha);
      rectMode(CENTER);
      noStroke();
      rect(pointX, pointY, pointSize, verticalSize);

      if (angle >= PI + PI / 2 && angle < PI + PI / 2 + speedSlider.value()) {
        let bufferIndex = scaleMappings[i];
        playSound(audioBuffers[bufferIndex]);
        if (!touchMovedOccurred) {
          flashBar(i);
        }
        
        
      }

      if (isPlaying) {
        band_point.angle += speedSlider.value();
        band_point.angle %= TWO_PI;
      }
      
      if (touchMovedOccurred) {
        let deltaY = touchY - previousTouchY;
        
        if (deltaY > 0) {
          band_point.angle += 0.03;
          band_point.angle = ((band_point.angle % TWO_PI) + TWO_PI) % TWO_PI;
          
          textureY -= 0.03 * 140;
          if (textureY <= -textureBuffer.height) {
            textureY += textureBuffer.height;
          }          
        }
        if (deltaY < 0) {
          band_point.angle -=0.03;
          band_point.angle = ((band_point.angle % TWO_PI) + TWO_PI) % TWO_PI;
          textureY += 0.03 * 140;
          if (textureY <= -textureBuffer.height) {
            textureY += textureBuffer.height;
          }                
        }
      }
    }
  }
}

function togglePlayStop() {
  isPlaying = !isPlaying;
  if (isPlaying) {
    playStopButton.elt.src = 'images/pause_icon.jpg';
    randomButton.attribute('src', 'images/random_button_disabled.jpg');
  } else {
    playStopButton.elt.src = 'images/play_icon.jpg';
    randomButton.attribute('src', 'images/random_button.jpg');
  }
}

function touchMoved() {
  if (preventNoteCreation) return;
  if (isPlaying) return;
  
  // Get the current touch position
  let currentTouchY = touches[0].y;
  let currentTouchX = touches[0].x;
  
  let rectX = windowWidth * 0.05;
  let rectY = windowHeight * 0.36;
  let rectWidth = windowWidth * 0.89;
  let rectHeight = windowHeight * 0.476;    
  
  if (currentTouchX >= rectX && currentTouchX <= rectX + rectWidth &&
      currentTouchY >= rectY && currentTouchY <= rectY + rectHeight) {  
    touchMovedOccurred = true;
    
    // Calculate the change in the Y position
    if (previousTouchY !== undefined) {
      let deltaY = currentTouchY - previousTouchY;
    }

    // Update previous touch position
    previousTouchY = currentTouchY;
    return false;
  }
  
  return true;
}

function touchEnded() {
  if (touchMovedOccurred) {
    touchMovedOccurred = false; // Reset the flag for the next touch event.
    return;
  }

  if (audioContext.state !== 'running') {
    userStartAudio().then(() => {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed on touchEnded:', audioContext.state);
      }).catch((err) => {
        console.error('Error resuming AudioContext:', err);
      });
    }).catch((err) => {
      console.error('Error starting user audio:', err);
    });
  }

  if (preventNoteCreation) return;

  let buttonClicked = false;

  for (let btn of ellipseButtons) {
    let d = dist(touchX, touchY, btn.x, btn.y);
    if (d < btn.size / 1.8) {
      updateIndividualInstrumentArray(btn.id);
      buttonClicked = true;
    }
  }

  clickProximityX = windowWidth * 0.25 / numEllipses;
  for (let i = 0; i < ellipses.length; i++) {
    let ellipseData = ellipses[i];
    let dXLeft = abs(touchX - (ellipseData.centerX - clickProximityX));
    let dXRight = abs(touchX - (ellipseData.centerX + clickProximityX));
    let dY = abs(touchY - centerY);

    if ((dXLeft <= clickProximityX || dXRight <= clickProximityX) && dY <= clickProximityY) {
      let newAngle = asin((touchY - centerY) / (ellipseHeight / 2));
      newAngle = PI - newAngle;
      let canAdd = true;
      for (let band_point of ellipseData.points) {
        let distance = abs(newAngle - band_point.angle);
        if (distance < minDistance * (PI / 180)) {
          canAdd = false;
          break;
        }
      }

      if (canAdd) {
        ellipseData.points.push({ angle: newAngle });
        break;
      }
    }

    for (let j = ellipseData.points.length - 1; j >= 0; j--) {
      let band_point = ellipseData.points[j];
      let { angle } = band_point;

      let pointX = ellipseData.centerX + ellipseWidth / 2 * Math.cos(angle);
      let pointY = centerY + ellipseHeight / 2 * Math.sin(angle);

      if (dist(touchX, touchY, pointX, pointY) <= pointSize / 2) {
        ellipseData.points.splice(j, 1);
        break;
      }
    }
  }
}

function touchStarted() { 
  touchX = touches[0].x;
  touchY = touches[0].y;
  
  return true;
}

function playSound(buffer) {
  if (isPlaying) {

    let source = audioContext.createBufferSource();
    source.buffer = buffer;
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
  }
}

function flashBar(barIndex) {
  barColors[barIndex] = color(255, 75);
  setTimeout(() => {
    barColors[barIndex] = color(0, 60);
  }, 70);
}

function clearNotes() {
  for (let i = 0; i < ellipses.length; i++) {
    ellipses[i].points = [];
  }
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  createEllipses();
  redraw();
}

function positionrandomButton() {
  randomButton.position(windowWidth - 50, 80);
}

function createEllipses() {
  let spacing = windowWidth *0.9 / numEllipses;
  ellipseHeight = windowHeight * 0.5;
  clickProximityY = ellipseHeight;
  for (let i = 0; i < numEllipses; i++) {
    ellipses.push({ centerX: spacing * i + spacing, points: [] });
  }
}

function initializePointsArray() {
  let newEllipses = [];
  let spacing = windowWidth * 0.9 / numEllipses;
  ellipseHeight = windowHeight * 0.5;
  clickProximityY = ellipseHeight;

  for (let i = 0; i < numEllipses; i++) {
    let existingPoints = (ellipses[i] && ellipses[i].points) ? ellipses[i].points : [];
    newEllipses.push({ centerX: spacing * i + spacing, points: existingPoints });
  }

  ellipses = newEllipses;
  barColors = [];
  for (let i = 0; i < numEllipses; i++) {
    barColors[i] = color(0, 60);
  }  
}

function changeScale() {
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== 'disabled') {
    if (selectedScale === 'Major Pentatonic') {// pentatonic
      scaleMappings = majorPentatonic;
    } 
    if (selectedScale === 'Minor Pentatonic') {// pentatonic
      scaleMappings = minorPentatonic;
    }     
    if (selectedScale === 'Major scale') {
      scaleMappings = ionian;
    }
    if (selectedScale === 'Dorian mode') {
      scaleMappings = dorian;
    }
    if (selectedScale === 'Mixolydian mode') {
      scaleMappings = mixolydian;
    }
    if (selectedScale === 'Aeolian mode') {
      scaleMappings = aeolian;
    }
    if (selectedScale === 'Chromatic') {
      scaleMappings = chromatic;
    }
    if (selectedScale === 'Harmonic Minor') {
      scaleMappings = harmonicMinor;
    }    
    if (selectedScale === 'Whole Tone') {
      scaleMappings = wholeTone;
    }
    if (selectedScale === 'Octatonic') {
      scaleMappings = octatonic;
    }
  }
}

function changeInstrument() {
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== 'disabled') {
    // Process selected scale
    
    if (selectedInstrument === 'Comb') {
      individualInstrumentArray = new Array(37).fill(1);
    }    
    
    if (selectedInstrument === 'Piano') {
      individualInstrumentArray = new Array(37).fill(2);
    }
    if (selectedInstrument === 'Bells') {
      individualInstrumentArray = new Array(37).fill(3);
    }
    console.log('Selected instrument:', selectedInstrument);
    loadAudioSet(individualInstrumentArray);
  }
}

function updateIndividualInstrumentArray(indexToUpdate) {
  // Clear previous debounce timer
  clearTimeout(debounceTimerArray);
  debounceTimerArray = setTimeout(() => {
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      indexToUpdate = scaleMappings[indexToUpdate];
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 3) + 1;
      loadAudioSet(individualInstrumentArray);
    }
  }, 50); // debounce
}

function randomiseEverything() {
  if (!isPlaying) {  
    randomTempo = random(0.01, 0.03); // full range
    speedSlider.value(randomTempo);

    // start with number of notes
    numEllipses = int(random(10)) + 5;

    randomScale = random(["Major Pentatonic", "Minor Pentatonic", "Major scale", "Dorian mode", "Mixolydian mode", "Aeolian mode", "Chromatic", "Harmonic Minor", "Whole Tone", "Octatonic"]);
    scalesDropdown.selected(randomScale);
    changeScale();  

    points = [];
    initializePointsArray();

    generateRandomPointsArray();

    // individ. instruments
    individualInstrumentArray = [];
    for (let i = 0; i < 37; i++) {
    individualInstrumentArray.push(randomInt(1, 3));
  }
    loadAudioSet(individualInstrumentArray);    

  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomPointsArray() {
  let newEllipses = [];
  let spacing = windowWidth * 0.9 / numEllipses;
  ellipseHeight = windowHeight * 0.5;
  clickProximityY = ellipseHeight;

  for (let i = 0; i < numEllipses; i++) {
    let numPoints = Math.floor(random(0, 7)); // Generate a random number of points between 3 and 10
    let points = [];

    for (let j = 0; j < numPoints; j++) {
      let newAngle = random(TWO_PI); // Generate a random angle between 0 and 2*PI

      // Check minimum distance between angles
      let minDistance = radians(60); // Example: minimum distance of 10 degrees (converted to radians)
      let canAdd = true;

      for (let k = 0; k < points.length; k++) {
        let existingAngle = points[k].angle;
        let distance = abs(angleDifference(newAngle, existingAngle));
        if (distance < minDistance || (newAngle >= PI + PI / 2 && newAngle < PI + PI / 2 + speedSlider.value())) {
          canAdd = false;
          break;
        }
      }

      if (canAdd) {
        points.push({ angle: newAngle });
      }
    }

    newEllipses.push({ centerX: spacing * i + spacing, points: points });
  }

  ellipses = newEllipses; // Update the global ellipses array with new random points
  barColors = []; // Reset barColors array or initialize as needed
  for (let i = 0; i < numEllipses; i++) {
    barColors[i] = color(0, 60); // Example: initialize barColors array
  }
}

// Function to calculate the difference between two angles in radians
function angleDifference(angle1, angle2) {
  let diff = angle1 - angle2;
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  return abs(diff);
}

function noScroll() {
  document.body.style.overflow = 'hidden';
}

function popupHelp() {
  // Check if the helpDiv already exists, if so, remove it
  if (helpDiv) {
    helpDiv.remove();
  }

  // Create a div for the help popup
  helpDiv = createDiv();
  helpDiv.position(50, 50);
  helpDiv.style('background-color', '#f9f9f9');
  helpDiv.style('border', '1px solid #000');
  helpDiv.style('padding', '10px');
  helpDiv.style('z-index', '10');
  helpDiv.style('max-width', '90%'); // Optional, to limit the width
  helpDiv.style('font-family', 'Arial, Helvetica, sans-serif'); // Set the font

  // Add content to the help popup
  helpDiv.html(`
    <div style="position: relative; padding: 10px;">
      <ul style="margin: 0; padding: 0; list-style: none; line-height: 1.8;">
        <li>• Click to create a point</li>
        <li>• Click an existing point to delete it</li>
        <li>• Press + and - to add or remove space</li>
        <li>• Press ▶ to play your piece</li>
        <li>• Press the bin icon to reset</li>
        <li>• Change instrument with the menu or click the coloured pins</li>
        <li>• Change scales using the menu</li>
        <li>• Change tempo using the slider</li>
        <li>• Randomise with the dice icon</li>
        <li id="closeHelp" style="cursor: pointer; color: #007bff; text-decoration: underline;">close help</li>
      </ul>
    </div>
  `);


  // Prevent event propagation to the canvas
  helpDiv.elt.addEventListener('touchstart', (e) => e.stopPropagation());
  helpDiv.elt.addEventListener('touchmove', (e) => e.stopPropagation());
  helpDiv.elt.addEventListener('touchend', (e) => e.stopPropagation());

  // Create a close button inside the help popup
  let closeButton = select('#closeHelp');
  closeButton.mousePressed(closeHelp);
}

function closeHelp() {
  // Remove the help popup when the close button is pressed
  if (helpDiv) {
    helpDiv.remove();
  }
}