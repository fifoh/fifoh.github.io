// fix randomisation for the percussion and organ

p5.disableFriendlyErrors = true;
let lastState = '';
let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [255,228,209],   // Red for organ
  [0,0,0]    // Black for percussion
];

let helpButton;
let helpDiv;

let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);
let initialBPM_value;
let addButton, removeButton;
let speedSliderPosition;
let speedSliderWidth;
let isPlaying;
let activeSources;
let rectX;
let rectY;
let rectWidth;
let rectHeight;
let cellWidth;
let cellHeight;
let mainRectPadding;  
let checkbox;
let prevSliderValue = 0;

let randomButton;

let rows = 6;
const cols = 32;

let grid = [];
let gridChanged = true; 
let pixelsPerMillisecond = 0;
let animate = false;
let animationStartTime = 0;

let playButton;
let stopButton;
let clearButton;
let speedSlider;
let noteDuration = 500;
let totalAnimationTime = 8000;
let columnDuration = totalAnimationTime / cols;

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
      instrumentSet = 'organ';
    } else if (setNumber === 2) {
      instrumentSet = 'percussion';
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
    // If no files need to be loaded, call finishedLoading with an empty array
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
      instrumentSet = 'organ';
    } else if (setNumber === 2) {
      instrumentSet = 'percussion';
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
        instrumentSet = 'organ';
      } else if (setNumber === 2) {
        instrumentSet = 'percussion';
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
let dragging = false;
let initialRow = -1;
let initialCol = -1;

let lastTouch = null;
let touchMovedFlag = false;

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
  
  lastTouch = touches[0]; // Store the last touch information
  touchMovedFlag = false; // Reset the flag
  return true; // Prevent any default behavior on touch start
}

function touchEnded() {
  if (!touchMovedFlag && lastTouch) {
    gridChanged = true;
    if (getAudioContext().state !== 'running') {
      getAudioContext().resume();
    }
    
    let touchX = lastTouch.x;
    let touchY = lastTouch.y;
    let adjustedtouchX = touchX - rectX;
    let adjustedtouchY = touchY - rectY;
    let touch = lastTouch;
    let buttonClicked = false;
    for (let btn of ellipseButtons) {
      let d = dist(adjustedtouchX, adjustedtouchY, btn.x, btn.y);
      if (d < btn.size / 1.8) {
        updateIndividualInstrumentArray(btn.id);
        buttonClicked = true;
        gridChanged = true;
      }
    }
    if (touch.x > rectX && touch.x < rectX + rectWidth && touch.y > rectY && touch.y < rectY + rectHeight) {
      let col = floor((touch.x - rectX) / cellWidth);
      let row = rows - 1 - floor((touch.y - rectY) / (cellHeight + 5));
      if (grid[row][col]) {
        deleteCells(row, col);
      } else {
        grid[row][col] = true;
        initialRow = row;
        initialCol = col;
        dragging = true;
      }
    }
    
    gridChanged = true;
  }
  
  lastTouch = null; // Clear the stored touch information
  return true;
}

function touchMoved() {
  lastTouch = touches[0]; // Update the last touch information
  touchMovedFlag = true; // Set the flag to true indicating touch moved
  return true; // Prevent any default behavior on touch move
}

function setup() {
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  createCanvas(windowWidth * 2, windowHeight);
  window.addEventListener('resize', resizeCanvasToWindow);
  frameRate(60);  
  rectX = 50;
  rectY = 100;
  rectWidth = windowWidth * 1.8;
  rectHeight = windowHeight * 0.7;
  
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);

  cellWidth = rectWidth / cols;
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;
  mainRectPadding = 10;  
  
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.stroke(0, 120);
  graphics.strokeWeight(2);
  graphics.strokeCap(PROJECT);
  
  graphics.line(rectX - rectX * 0.15, rectY - rectY * 0.2, rectX - rectX * 0.15, rectHeight + rectHeight * 0.29);  
  
  initializeGridArray();
  playButton = createImg('images/play_icon.jpg', '▶');
  playButton.size(45, 45); 
  playButton.position(-10, -55);
  playButton.touchStarted(() => toggleAnimation(totalAnimationTime));
  playButton.parent('button-container');

  stopButton = createImg('images/stop_icon.jpg', '▶');
  stopButton.size(45, 45); 
  stopButton.position(-10, -55);
  stopButton.touchStarted(stopAnimation).hide();
  stopButton.parent('button-container');

  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.touchStarted(clearGrid);
  clearButton.position(windowWidth - 65, -55); 
  clearButton.parent('button-container');
  
  helpButton = createImg('images/help_icon.jpg', '?');
  helpButton.size(45,45);
  positionhelpButton();     
  helpButton.touchStarted(popupHelp); 
  helpButton.parent('button-container');
  
  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(45, -55);
  metroImage.parent('button-container');
  
  randomButton = createImg("images/random_button.jpg", "R")
  randomButton.size(45, 45);
  randomButton.touchStarted(randomiseEverything);
  randomButton.parent('button-container');
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
  scalesDropdown.parent('button-container');
  scalesDropdown.position(windowWidth/2, windowHeight - 110);

  scalesDropdown.changed(changeScale);
  instrumentDropdown = createSelect();
  instrumentDropdown.option('Select an Instrument:', '');
  instrumentDropdown.option('organ');
  instrumentDropdown.option('percussion');
  instrumentDropdown.position(10, windowHeight - 110);
  instrumentDropdown.parent('button-container');
  instrumentDropdown.changed(changeInstrument);  

  let sliderWrapper = select('.slider-wrapper');
  speedSlider = createSlider(40, 240, 100, 1);
  speedSlider.position(45 + metroImage.width, -21);
  speedSliderPosition = 45 + metroImage.width;
  speedSlider.parent(sliderWrapper);
  speedSlider.style('width', '60px');
  speedSliderWidth = speedSlider.width;
  speedSlider.input(updateSpeed);
  speedSlider.touchStarted(updateSpeed);
  speedSlider.touchMoved(updateSpeed);
  speedSlider.touchEnded(updateSpeed);
  
  updateSpeed();
  addButton = createImg('images/add_row.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 65 - addButton.width, -55);
  addButton.parent('button-container');

  addButton.touchStarted(() => {
    if (rows < 15) {
      rows++;
      initializeGridArray();
      gridChanged = true;
    }
  });  

  removeButton = createImg('images/minus_row.jpg', '-');
  removeButton.size(45, 45);
  removeButton.parent('button-container');
  removeButton.position(windowWidth - 65 - removeButton.width - addButton.width, -55);

  removeButton.touchStarted(() => {
    if (rows > 5) {
      rows--;
      initializeGridArray();
      gridChanged = true;
    }
  });   
  
  touchStarted = touchStarted;
  touchEnded = touchEnded;
  touchMoved = touchMoved;
}

function fillCells(row, col1, col2) {
  if (col1 > col2) [col1, col2] = [col2, col1]; // Swap if col1 is greater than col2
  for (let col = col1; col <= col2; col++) {
    grid[row][col] = true;
  }
}

function clearGrid() {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < cols; j++) {
      grid[i][j] = false;
    }
  }
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
  instrumentDropdown.value('organ');
  gridChanged = true;
}

function deleteCells(row, col) {
  let left = col;
  while (left >= 0 && grid[row][left]) {
    grid[row][left] = false;
    left--;
  }
  let right = col + 1;
  while (right < cols && grid[row][right]) {
    grid[row][right] = false;
    right++;
  }
}

function draw() { 
  
  if (gridChanged || animate || speedSlider.value() !== prevSliderValue) {
    clear();
    background(250);
    translate(rectX, rectY);

    fill(255);
    stroke(1, 20);
    rect(-mainRectPadding, -mainRectPadding, rectWidth + 2 * mainRectPadding, rectHeight + 2 * mainRectPadding);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        noStroke();
        fill(grid[i][j] ? 0 : 255); // cell colour
        rect(j * cellWidth, (rows - 1 - i) * (cellHeight + 5), cellWidth, cellHeight);
      }
    }
    for (let i = 0; i < rows; i++) {
      let buttonSize = cellHeight * 0.4;
      let buttonX = -30;
      let buttonY = (rows - 1 - i) * (cellHeight + 5) + cellHeight / 2;
      ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
      let originalIndex = scaleMappings[i];
      let colIndex = individualInstrumentArray[originalIndex] - 1;
      fill(ellipseColors[colIndex]);
      strokeWeight(0);
      ellipse(buttonX, buttonY, buttonSize, buttonSize);      
    }
    for (let j = 0; j <= cols; j++) {
      // transparency
      if (j % 4 === 0) {
        strokeWeight(2);
        stroke(0, 0, 0, 50);
      } else if (j % 1 === 0) {
        strokeWeight(1);
        stroke(0, 0, 0, 35);
      } else {
        continue;
      }
      line(j * cellWidth, 0, j * cellWidth, rectHeight);
    }
    translate(-rectX, -rectY);
    gridChanged = false;
    image(graphics, 0, 0);
    
    // BPM
    noStroke();
    fill(0);
    
    // optional tempo markings
    // text("♩ = " + speedSlider.value(), speedSliderPosition + speedSliderWidth * 1.2, 13);

    if (animate) {
      let elapsedTime = millis() - animationStartTime;
      let animationProgress = elapsedTime / totalAnimationTime;
      rectX = 50 - animationProgress * (rectWidth + mainRectPadding);

      let currentCol = floor(elapsedTime / columnDuration);
      playColumnSounds(currentCol);

      if (currentCol >= cols) stopAnimation();
    }
  }
  prevSliderValue = speedSlider.value();
}

function updateSpeed() {
  if (!animate) {
    initialBPM_value = speedSlider.value();
  }
  
  let BPM_value = speedSlider.value();

  let newTotalAnimationTime = ((60 / BPM_value) * 16) * 1000; // change (*16) if changing grid size

  if (animate) {
    // Calculate the current progress percentage
    let progress = (millis() - animationStartTime) / totalAnimationTime;

    totalAnimationTime = newTotalAnimationTime;
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;

    animationStartTime = millis() - (progress * totalAnimationTime);
  } else {
    totalAnimationTime = newTotalAnimationTime;
  }

  columnDuration = totalAnimationTime / cols;
}

function toggleAnimation() {
  animate = !animate;
  if (animate) {
    randomButton.attribute('src', 'images/random_button_disabled.jpg');
    playButton.hide();
    stopButton.show();
    pixelsPerMillisecond = (rectX + rectWidth + mainRectPadding) / totalAnimationTime;
    animationStartTime = millis();
    columnDuration = totalAnimationTime / cols;
  } else {
    stopAnimation();
  }
}

function stopAnimation() {
  animate = false;
  stopButton.hide();
  randomButton.attribute('src', 'images/random_button.jpg');
  playButton.show();
  rectX = 50;
  isPlaying.fill(false);
  activeSources.forEach(source => source && stopSoundWithFadeOut(source));
  activeSources.fill(null);
  gridChanged = true; // force redraw
}

function playColumnSounds(col) {
  if (col < 0 || col >= cols) return;
  for (let row = 0; row < rows; row++) {
    if (grid[row][col]) {
      if (!isPlaying[row]) {
        playSound(row);
        isPlaying[row] = true;
      }
    } else {
      if (isPlaying[row]) {
        stopSound(row);
        isPlaying[row] = false;
      }
    }
  }
}

function playSound(row) {
  let bufferIndex = scaleMappings[row];
  playSoundFromBuffer(audioBuffers[bufferIndex], row);
}

function playSoundFromBuffer(buffer, row) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.3;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start();
  activeSources[row] = { source: source, gainNode: gainNode };
}

function stopSound(row) {
  let activeSource = activeSources[row];
  if (activeSource) {
    stopSoundWithFadeOut(activeSource);
    activeSources[row] = null;
  }
}

function stopSoundWithFadeOut(activeSource) {
  let gainNode = activeSource.gainNode;
  gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.025);
  activeSource.source.stop(audioContext.currentTime + 0.025);
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth * 2, windowHeight);
  redraw();
}

function initializeGridArray() {
  let newGrid = Array(rows).fill().map(() => Array(cols).fill(false));
  for (let i = 0; i < Math.min(grid.length, rows); i++) {
    for (let j = 0; j < cols; j++) {
      newGrid[i][j] = grid[i][j];
    }
  }
  grid = newGrid;
  cellHeight = (rectHeight - (rows - 1) * 5) / rows;
  isPlaying = Array(rows).fill(false);
  activeSources = Array(rows).fill(null);
  gridChanged = true;
}

function changeScale() {
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== 'disabled') {
    if (selectedScale === 'Major Pentatonic') {
      scaleMappings = majorPentatonic;
    } 
    if (selectedScale === 'Minor Pentatonic') {
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
    if (selectedInstrument === 'organ') {
      individualInstrumentArray = new Array(37).fill(1);
    }    
    if (selectedInstrument === 'percussion') {
      individualInstrumentArray = new Array(37).fill(2);
    }
    console.log('Selected instrument:', selectedInstrument);
    loadAudioSet(individualInstrumentArray);
    gridChanged = true;
  }
}

function updateIndividualInstrumentArray(indexToUpdate) {
  clearTimeout(debounceTimerArray);
  debounceTimerArray = setTimeout(() => {
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      indexToUpdate = scaleMappings[indexToUpdate];
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 2) + 1;
      loadAudioSet(individualInstrumentArray);
      gridChanged = true;
    }
  }, 50); // debounce
}


function positionrandomButton() {
  randomButton.position(windowWidth - 65, -57 + randomButton.height);
}

function positionhelpButton() {
  helpButton.position(windowWidth - 65 - helpButton.width, -57 + helpButton.height);
}

function randomiseEverything() {
  if (!animate) {  
    instrumentDropdown.value('Select an Instrument:');
    randomTempo = randomInt(60, 240); // int, avoid slowest option
    speedSlider.value(randomTempo);

    // rows
    rows = int(random(5)) + 10;

    randomScale = random(["Major Pentatonic", "Major Pentatonic", "Minor Pentatonic", "Minor Pentatonic", "Major scale", "Major scale", "Dorian mode", "Mixolydian mode", "Aeolian mode", "Chromatic", "Harmonic Minor", "Whole Tone", "Octatonic"]);
    scalesDropdown.selected(randomScale);
    changeScale();  

    initializeGridArray();
    createRandomPoints();
    
    // define percussion parts as lower 5
    let numPercussionParts;
    if (randomScale === "Major Pentatonic") {
      numPercussionParts = 10;
    } 
    if (randomScale === "Minor Pentatonic") {
      numPercussionParts = 10;
    } 
    if (randomScale === "Dorian mode") {
      numPercussionParts = 8;
    }     
    if (randomScale === "Major scale") {
      numPercussionParts = 8;
    }     
    if (randomScale === "Mixolydian mode") {
      numPercussionParts = 8;
    }   
    if (randomScale === "Aeolian mode") {
      numPercussionParts = 8;
    }         
    if (randomScale === "Chromatic") {
      numPercussionParts = 5;
    }         
    if (randomScale === "Harmonic Minor") {
      numPercussionParts = 8;
    }         
    if (randomScale === "Whole Tone") {
      numPercussionParts = 9;
    }     
    if (randomScale === "Octatonic") {
      numPercussionParts = 7;
    }     
    

    // individ. instruments
    individualInstrumentArray = [];
    for (let i = 0; i < 37; i++) {
      if (i >= numPercussionParts) {
        individualInstrumentArray.push(1); // Always 1 for i >= numPercussionParts
      } else {
        individualInstrumentArray.push(2); // Always 2 for i < numPercussionParts
      }
    }
    
    generatePercussionPart();

    loadAudioSet(individualInstrumentArray);    
    gridChanged = true;  
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let sequence = []; // Array to store the sequence
let maxDifference = 2;

// create random single line melody
function createRandomPoints() {
  grid = [];
  sequence = [];
  
  // Initialize grid 
  for (let i = 0; i < rows; i++) {
    grid.push(new Array(cols).fill(false));
  }
  
  // constrain melody to upper rows
  let firstNumber = floor(random(6, rows));
  sequence.push(firstNumber);
  
  // Finish sequence ensuring above lower rows
  for (let i = 1; i < cols; i++) {
    let prevNumber = sequence[i - 1];
    
    let nextNumber = prevNumber + floor(random(-maxDifference, maxDifference + 1));
    nextNumber = constrain(nextNumber, 6, rows-1);
    sequence.push(nextNumber);
  }  
  
  // Set values in grid based on random sequence
  for (let i = 0; i < cols; i++) {
    // random rests
    if (random(1) < 0.1) {
      continue;
    }

    let row = sequence[i];
    let col = i;
    grid[row][col] = true;
  }
}

function generatePercussionPart() {
  // lower rows for perc. part
  sequence = [];
  let firstNumber = floor(random(0, 4));
  sequence.push(firstNumber);
  
  for (let i = 1; i < cols; i++) {
    let prevNumber = sequence[i - 1];
    let nextNumber = prevNumber + floor(random(-maxDifference, maxDifference + 1));
    nextNumber = constrain(nextNumber, 0, 4);
    sequence.push(nextNumber);
  }  
  
  for (let i = 0; i < cols; i++) {
    // Introduce a probability to skip setting the value in the grid (rests)
    if (random(1) < 0.1) {
      continue;
    }

    let row = sequence[i];
    let col = i; 
    
    if (row <= 4) {
      grid[row][col] = true;
    }
  }
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
  helpDiv.style('max-width', '80%'); // Optional, to limit the width
  helpDiv.style('font-family', 'Arial, Helvetica, sans-serif'); // Set the font

  // Add content to the help popup
  helpDiv.html(`
    <div style="position: relative; padding: 10px;">
      <ul style="margin: 0; padding: 0; list-style: none; line-height: 1.8;">
        <li>• Click to create a note</li>
        <li>• Click an existing note to delete it</li>
        <li>• Press + and - to add or remove rows</li>
        <li>• Press ▶ to play your piece</li>
        <li>• Press the bin icon to reset</li>
        <li>• Change between organ and percussion using the menu or click the coloured pins</li>
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