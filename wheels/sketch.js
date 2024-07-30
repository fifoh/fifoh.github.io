p5.disableFriendlyErrors = true;
let originalBarColors = [];
const touchThreshold = 50;
let numWheels = 6;
let playingSources = [];
let clearButton;
let rightarrowButton;
let leftarrowButton;
let angle = 0;
let numSpokes = 32;
let spokeVisible = [];
for (let i = 1; i <= numWheels; i++) {
  spokeVisible[i] = [];
  for (let j = 0; j < numSpokes; j++) {
    spokeVisible[i][j] = false;
  }
}

let angleSlider; // hidden
let durationSlider;
let scaleFactor = 0.7;
let selectedWheel = 1;

let timeouts = [];
let isPlaying = false;
let playButton;

let randomButton;

let startTime, endTime, duration, isAnimating = false;
let startAngle, endAngle;
let slowDownFactor = 32.0; // slow animation
let barColors = [];

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

// Audio
let audioBuffers = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

function setup() {
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  createCanvas(windowWidth, windowHeight);
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.stroke(0, 50);
  graphics.strokeWeight(3);
  graphics.noFill();
  graphics.rect(0, 0, windowWidth, windowHeight);
  frameRate(60);
  getAudioContext().resume();
  
  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.position(windowWidth-50, 30);
  clearButton.touchStarted(clearNotes);  

  playButton = createImg('images/play_icon.jpg', '▶');   
  playButton.size(45, 45); 
  playButton.position(10, 30);
  playButton.touchStarted(togglePlayback);
  
  rightarrowButton = createImg('images/leftarrow_icon.jpg', '<');
  rightarrowButton.size(45, 45);
  rightarrowButton.position(10, 30 + playButton.height + 15);
  rightarrowButton.touchStarted(rightarrowPressed); 
  
  leftarrowButton = createImg('images/rightarrow_icon.jpg', '>');
  leftarrowButton.size(45, 45);
  leftarrowButton.position(20 + rightarrowButton.width, 30 + playButton.height + 15);
  leftarrowButton.touchStarted(leftarrowPressed);     
  
  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(10 + playButton.width, 30)

  let sliderWrapper = select('.slider-wrapper');
  durationSlider = createSlider(0.1, 0.4, 0.3, 0);
  durationSlider.parent(sliderWrapper);
  durationSlider.style('width', '50px');
  durationSlider.position(10 + playButton.width + metroImage.width, 40); 
  
  angleSlider = createSlider(0, TWO_PI, 0, 0.01);
  angleSlider.position(10 + playButton.width + metroImage.width, 60);  
  angleSlider.attribute('hidden', '');  
  
  let addButton = createImg('images/plus_ring.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);
  addButton.touchStarted(() => {
    if (numWheels < 15) {
      numWheels++;
      initializePointsArray();
      updateButtons();
      updateBarColors();
    }
  });

  let removeButton = createImg('images/minus_ring.jpg', '-');
  removeButton.size(45, 45);
  removeButton.position(windowWidth - 60 - removeButton.width - addButton.width, 30);
  removeButton.touchStarted(() => {
    if (numWheels > 3) {
      numWheels--;
      if (selectedWheel > numWheels+1) {
        selectedWheel = numWheels+1;
      }
      initializePointsArray();
      updateButtons();
      updateBarColors();
    }
  });
  
  // random button
  randomButton = createImg("images/random_button.jpg", "R")
  randomButton.size(45, 45);
  randomButton.touchStarted(randomiseEverything);
  positionrandomButton();      

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
  
  for (let i = 0; i < numWheels; i++) {
    if (i === selectedWheel-1) {
      originalBarColors[i] = color(0); // black color for the selected wheel
    } else {
      originalBarColors[i] = color(0, 60); // grey color for other wheels
    }
    barColors[i] = originalBarColors[i];
  }
}

let lastFrameTime = 0;
function draw() {
  let currentFrameTime = millis();
  if (currentFrameTime - lastFrameTime > 16) {
    background(250);
    image(graphics, 0, 0);
    let circle_thickness = 2;
    strokeWeight(circle_thickness);

    // Define center position
    let centerX = windowWidth / 0.91;
    let centerY = windowHeight / 1.39;

    if (isAnimating) {
      let currentTime_animation = millis();
      if (currentTime_animation >= endTime) {
        // Loop the angle animation
        startTime = currentTime_animation;
        endTime = startTime + duration;
        startAngle = angleSlider.value();
        endAngle = startAngle + TWO_PI;
      }
      let t = (currentTime_animation - startTime) / duration;
      angle = lerp(startAngle, endAngle, t);
      angleSlider.value(angle % TWO_PI);
    } else {
      angle = angleSlider.value();
    }

    // Draw wheels in reverse
    for (let i = numWheels; i >= 1; i--) {
      push();
      wheelSpacingX = (windowWidth/numWheels)*0.4;
      wheelSpacingY = (windowHeight/numWheels)*0.5;      
      startingwheelX = windowWidth * 0.25 // was 0.2
      startingwheelY = windowHeight * 0.7      
      
      translate(startingwheelX + (i - 1) * wheelSpacingX, startingwheelY - (i - 1) * wheelSpacingY);
      if (selectedWheel === i || selectedWheel < 1 || selectedWheel > numWheels) {
        drawWheel(200 * scaleFactor, spokeVisible[i], 190);
      } else {
        drawWheel(200 * scaleFactor, spokeVisible[i], 15);
      }
      pop();
    }

    // Draw transparent bars
    let bar_thickness = 3;
    strokeWeight(bar_thickness);
    for (let i = 0; i < numWheels; i++) {
      stroke(barColors[i]);
      strokeWeight(bar_thickness);
      let barOffsetX = 90;
      let barOffsetY = -10;
      let startX = barOffsetX + startingwheelX + i * wheelSpacingX;
      let startY = barOffsetY + startingwheelY - i * wheelSpacingY;
      let endX = startX + 70 - i * 4; // Adjust the length as needed
      let endY = startY;
      line(startX, startY, endX, endY);

      
      let buttonSize = 20;
      let buttonX = endX;
      let buttonY = endY;
      ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
      let originalIndex = scaleMappings[i];
      let colIndex = individualInstrumentArray[originalIndex] - 1;

      fill(ellipseColors[colIndex]);
      stroke(barColors[i]);
      strokeWeight(0);    
      ellipse(buttonX, buttonY, buttonSize, buttonSize);           
    }
  }
}

function drawWheel(diameter, visibleSpokes, alpha) {
  stroke(0, 0, 0, alpha);
  strokeWeight(1.5)
  fill(253, 253, 253, alpha);
  ellipse(0, 0, diameter, diameter);
  let spokeExtension = 10 * scaleFactor;
  
  for (let i = 0; i < numSpokes; i++) {
    let originalX = Math.cos(angle + i * TWO_PI / numSpokes) * (diameter / 2);
    let originalY = Math.sin(angle + i * TWO_PI / numSpokes) * (diameter / 2);    
    
    let x1 = Math.cos(angle + i * TWO_PI / numSpokes) * (diameter / 2 - spokeExtension);
    let y1 = Math.sin(angle + i * TWO_PI / numSpokes) * (diameter / 2 - spokeExtension);
    let x2 = Math.cos(angle + i * TWO_PI / numSpokes) * (diameter / 2 + 25 * scaleFactor);
    let y2 = Math.sin(angle + i * TWO_PI / numSpokes) * (diameter / 2 + 25 * scaleFactor);
    
    if (visibleSpokes[i]) {
      drawSpoke(x1, y1, x2, y2, alpha);
    }
    drawMark(originalX, originalY, alpha);
  }
}

function drawSpoke(x1, y1, x2, y2, alpha) {
  stroke(0, alpha);
  fill(0, alpha);  
  let dx = x2 - x1;
  let dy = y2 - y1;  
  let length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    console.error("Zero length vector:", dx, dy);
    return;
  }
  dx /= length;
  dy /= length;  
  let perpX = -dy;
  let perpY = dx;  
  let halfWidth = 1.9;
  let x3 = x1 - perpX * halfWidth;
  let y3 = y1 - perpY * halfWidth;
  let x4 = x1 + perpX * halfWidth;
  let y4 = y1 + perpY * halfWidth;
  triangle(x3, y3, x4, y4, x2, y2);
}

function drawMark(x, y, alpha) {
  fill(0, 0, 0, alpha);
  noStroke();
  ellipse(x, y, 5 * scaleFactor, 5 * scaleFactor); // Small circle as a mark
}

function touchStarted() {
  if (audioContext.state !== 'running') {
    userStartAudio().then(() => {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed on mousePressed:', audioContext.state);
      }).catch((err) => {
        console.error('Error resuming AudioContext:', err);
      });
    }).catch((err) => {
      console.error('Error starting user audio:', err);
    });
  }  
  if (touches.length > 0) {
    let touchX = touches[0].x;
    let touchY = touches[0].y;
    let buttonClicked = false;

    // Check if a button is clicked
    for (let btn of ellipseButtons) {
      let d = dist(touchX, touchY, btn.x, btn.y);
      if (d < btn.size / 1.8) {
        updateIndividualInstrumentArray(btn.id);
        buttonClicked = true;
      }
    }    

    // If no button was clicked, check the spokes
    if (!buttonClicked && selectedWheel >= 1 && selectedWheel <= numWheels) {
      let spokeX = startingwheelX + (selectedWheel - 1) * wheelSpacingX;
      let spokeY = startingwheelY - (selectedWheel - 1) * wheelSpacingY;
      checkSpokes(spokeX, spokeY, spokeVisible[selectedWheel], touchX, touchY);
    }
  }
  return true;
}

function checkSpokes(centerX, centerY, visibleSpokes, touchX, touchY) {
  for (let i = 0; i < numSpokes; i++) {
    let x1 = Math.cos(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2);
    let y1 = Math.sin(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2);
    let x2 = Math.cos(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2 + 50 * scaleFactor);
    let y2 = Math.sin(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2 + 50 * scaleFactor);
    let d = dist(touchX - centerX, touchY - centerY, x1, y1); // Distance from touch to spoke
    if (d < 12) {
      visibleSpokes[i] = !visibleSpokes[i];
      break;
    }
  }
}

function rightarrowPressed() {
  selectedWheel = max(0, selectedWheel - 1);
  updateButtons();
  updateBarColors();
}

function leftarrowPressed() {
  selectedWheel = min(numWheels + 1, selectedWheel + 1);
  updateButtons();
  updateBarColors();
}

function togglePlayback() {
  if (isPlaying) {
    stopSounds();
  } else {
    playSounds();
    startAngleAnimation();
  }
}

function playSounds() {
  isPlaying = true;
  playButton.attribute('src', 'images/stop_icon.jpg');
  randomButton.attribute('src', 'images/random_button_disabled.jpg');
  
  // mapping duration (reverse)
  let unmappedDuration = durationSlider.value();
  let duration = map(unmappedDuration, 0.1, 0.4, 0.4, 0.1) * 1000
  let currentTime_animation = 0;
  
  durationSlider.attribute('disabled', '');

  for (let i = numSpokes - 1; i >= 0; i--) {
    let timeoutID = setTimeout((spokeIndex) => {
      for (let j = 1; j <= numWheels; j++) {
        if (spokeVisible[j][spokeIndex]) {
          let bufferIndex = scaleMappings[j - 1];
          playSound(bufferIndex);
          flashBar(j - 1);
        }
      }
    }, currentTime_animation, i);
    timeouts.push(timeoutID);

    currentTime_animation += duration;
  }
  let finalTimeoutID = setTimeout(() => {
    playSounds(); // Restart playback
  }, currentTime_animation);
  timeouts.push(finalTimeoutID);
}

function playSound(index) {
  if (audioBuffers[index]) {
    let source = audioContext.createBufferSource();
    source.buffer = audioBuffers[index];
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.25;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
    playingSources.push(source);
    source.onended = function() {
      let index = playingSources.indexOf(source);
      if (index > -1) {
        playingSources.splice(index, 1);
      }
    };
  }
}

function stopSounds() {
  isPlaying = false;
  playButton.attribute('src', 'images/play_icon.jpg');
  randomButton.attribute('src', 'images/random_button.jpg');
  durationSlider.removeAttribute('disabled');
  for (let i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }
  timeouts = [];
  stopAngleAnimation();
  let promises = playingSources.map(source => new Promise(resolve => {
    source.onended = resolve;
  }));
}

function startAngleAnimation() {
  startTime = millis();
  unmappedDuration = durationSlider.value();
  duration = map(unmappedDuration, 0.1, 0.4, 0.4, 0.1) * 1000  
  duration = duration * slowDownFactor;
  startAngle = angleSlider.value();
  endAngle = startAngle + TWO_PI;
  isAnimating = true;
}

function stopAngleAnimation() {
  isAnimating = false;
  let duration = 1000;
  let currentAngle = angleSlider.value();
  let step = currentAngle / (duration / 10);
  let interval = setInterval(() => {
    currentAngle -= step;
    angle = currentAngle;
    angleSlider.value(currentAngle);
    if (currentAngle <= 0) {
      clearInterval(interval);
    }
  }, 1);
}

function flashBar(barIndex) {
  // Save the original color
  let originalColor = barColors[barIndex];

  // Set the bar color to white with some opacity
  barColors[barIndex] = color(255, 75);
  
  // Revert to the original color after a timeout
  setTimeout(() => {
    barColors[barIndex] = originalColor;
  }, 70);
}

function clearNotes() {
  for (let i = 1; i <= numWheels; i++) {
    spokeVisible[i] = [];
    for (let j = 0; j < numSpokes; j++) {
      spokeVisible[i][j] = false;
    }
  }
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
}


function initializePointsArray() {
  let newSpokeVisible = [];
  for (let i = 1; i <= numWheels; i++) {
    barColors[i] = color(0, 60);
    newSpokeVisible[i] = [];
    if (spokeVisible[i]) {
      // Copy existing spokes data
      for (let j = 0; j < numSpokes; j++) {
        newSpokeVisible[i][j] = spokeVisible[i][j];
      }
    } else {
      // Initialize new wheel spokes as false
      for (let j = 0; j < numSpokes; j++) {
        newSpokeVisible[i][j] = false;
      }
    }
  }
  spokeVisible = newSpokeVisible;
}

function changeInstrument() {
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== 'disabled') {
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

function updateButtons() {
  if (selectedWheel <= 0) {
    rightarrowButton.attribute('disabled', 'true');
    rightarrowButton.attribute('src', 'images/leftarrow_disabled_icon.jpg'); 
  } else {
    rightarrowButton.removeAttribute('disabled');
    rightarrowButton.attribute('src', 'images/leftarrow_icon.jpg'); 
  }
  if (selectedWheel >= numWheels + 1) {
    leftarrowButton.attribute('disabled', 'true');
    leftarrowButton.attribute('src', 'images/rightarrow_disabled_icon.jpg'); 
  } else {
    leftarrowButton.removeAttribute('disabled');
    leftarrowButton.attribute('src', 'images/rightarrow_icon.jpg'); 
  }
}

function updateBarColors() {
  for (let i = 0; i < numWheels; i++) {
    if (i === selectedWheel-1) {
      originalBarColors[i] = color(0); // black color for the selected wheel
    } else {
      originalBarColors[i] = color(0, 60); // grey color for other wheels
    }
    barColors[i] = originalBarColors[i];
  }
}

function positionrandomButton() {
  randomButton.position(windowWidth - 50, 80);
}

function randomiseEverything() {
  if (!isPlaying) {

    randomTempo = random(0.15, 0.4); // avoid slowest option - full range
    durationSlider.value(randomTempo);

    // start with number of notes
    numWheels = int(random(12)) + 3;

    randomScale = random(["Major Pentatonic", "Minor Pentatonic", "Major Pentatonic", "Minor Pentatonic", "Major scale", "Dorian mode", "Mixolydian mode", "Aeolian mode", "Chromatic", "Harmonic Minor", "Whole Tone", "Octatonic"]);
    scalesDropdown.selected(randomScale);
    changeScale(); 

    createRandomPoints(int(random(30)+10));  
    initializePointsArray();
    updateButtons();
    updateBarColors();

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

function createRandomPoints(numPoints) {
  
  let random_density = random(0.2) + 0.79
  
  spokeVisible = [];
  for (let i = 0; i < numWheels+1; i++) {
    spokeVisible[i] = [];
    for (let j = 0; j < numSpokes; j++) {
      // Ensure that no two consecutive spokes are visible
      if (j > 0 && spokeVisible[i][j - 1]) {
        spokeVisible[i][j] = false;
      } else {
        spokeVisible[i][j] = random() > random_density; // Adjust the probability as needed
      }
    }
  }
}