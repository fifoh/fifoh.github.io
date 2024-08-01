p5.disableFriendlyErrors = true;
let debounceTimer;
let debounceTimerArray;
let loadedInstrumentSetBuffers = {};

let helpButton;
let helpDiv;

let lastState = '';

let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [255, 228, 209], // Red [255,228,209]
  [203, 237, 209], // Green [203,237,209]
  [167, 234, 255], // Blue [187,234,255]
  
];

let individualInstrumentArray = new Array(37).fill(1);

let touchThreshold = 30;
let startX, startY;
let cylinderYCoordinates;
let clearButton;
let canvasTopBoundary = 70;

let randomButton;

// start index for playback array
let angleX = 0;
let angleY = 0;
let angleZ = 0;
let cylinderCoordinates = [];
let colors = [];
let notes = [];

let isDragging = false;
let rotationalValue = 0;
let addButton;
let removeButton;
let note_duration = 200;

let totalHorizontalPoints = 32;
let totalVerticalPoints = 3;
let totalDuration = note_duration * totalHorizontalPoints;

// audio
let audioBuffers = [];
let timeouts = [];
let isPlaying = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;
let startTime;
let playButton;
let durationSlider;
let timeoutIds = [];
let radius;
let cylinderHeight;

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url, index) {
  let request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";
  let loader = this;
  request.onload = function () {
    loader.context.decodeAudioData(
      request.response,
      function (buffer) {
        if (!buffer) {
          console.error("Error decoding file data: " + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function (error) {
        console.error("decodeAudioData error for " + url, error);
      }
    );
  };
  request.onerror = function () {
    console.error("BufferLoader: XHR error for " + url);
  };
  request.send();
};

BufferLoader.prototype.load = function () {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

// Line colours
let defaultLineColor = [0, 0, 0, 40];
let activeLineColor = [255, 255, 255];
let lineColors = Array(totalVerticalPoints).fill(defaultLineColor);
let lineSpacing = 37;

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
    let instrumentSet = "";
    if (setNumber === 1) {
      instrumentSet = "comb";
    } else if (setNumber === 2) {
      instrumentSet = "piano";
    } else if (setNumber === 3) {
      instrumentSet = "bells";
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
    let instrumentSet = "";
    if (setNumber === 1) {
      instrumentSet = "comb";
    } else if (setNumber === 2) {
      instrumentSet = "piano";
    } else if (setNumber === 3) {
      instrumentSet = "bells";
    }
    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = "";
      if (setNumber === 1) {
        instrumentSet = "comb";
      } else if (setNumber === 2) {
        instrumentSet = "piano";
      } else if (setNumber === 3) {
        instrumentSet = "bells";
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
  15: 36,
};

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
  15: 36,
};

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
  15: 26,
};

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
  15: 26,
};

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
  15: 26,
};

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
  15: 26,
};

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
  15: 15,
};

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
  15: 26,
};

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
  15: 30,
};

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
  15: 22,
};

let scaleMappings = majorPentatonic;

function setup() {
  // Suspend the AudioContext
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  createCanvas(windowWidth, windowHeight, WEBGL);
  window.addEventListener("resize", resizeCanvasToWindow);
  frameRate(60);

  radius = windowWidth * 0.2;
  cylinderHeight = windowHeight * 0.4;

  createPlayButton();

  metroImage = createImg("images/metro_icon.jpg", "tempo");
  metroImage.size(45, 45);
  positionMetroIcon();

  addButton = createImg("images/plus_icon.jpg", "+");
  addButton.size(45, 45);
  addButton.touchStarted(addNote);

  removeButton = createImg("images/minus_icon.jpg", "-");
  removeButton.size(45, 45);
  removeButton.touchStarted(removeNote);

  positionplus_minus_Buttons();

  let sliderWrapper = select(".slider-wrapper");
  durationSlider = createSlider(200, 1000, 800); // Min 200 ms, Max 1s, Initial 800 ms
  positionDurationSlider();
  durationSlider.parent(sliderWrapper);
  durationSlider.style("width", "90px");

  note_duration = durationSlider.value();
  totalDuration = note_duration * totalHorizontalPoints;

  clearButton = createImg("images/bin_icon.jpg", "✖");
  clearButton.size(45, 45);
  clearButton.touchStarted(clearNotes);
  positionclearButton();
  
  randomButton = createImg("images/random_button.jpg", "R")
  randomButton.size(45, 45);
  randomButton.touchStarted(randomiseEverything);
  positionrandomButton();  
  
  helpButton = createImg('images/help_icon.jpg', '?');
  helpButton.size(45,45);
  helpButton.position(5, windowHeight - 75);
  helpButton.touchStarted(popupHelp);    

  scalesDropdown = createSelect();
  scalesDropdown.option("Select a Scale:", ""); // This will be the heading
  scalesDropdown.disable("Select a Scale:", "");
  scalesDropdown.option("Major Pentatonic");
  scalesDropdown.option("Minor Pentatonic");
  scalesDropdown.option("Major scale");
  scalesDropdown.option("Dorian mode");
  scalesDropdown.option("Mixolydian mode");
  scalesDropdown.option("Aeolian mode");
  scalesDropdown.option("Chromatic");
  scalesDropdown.option("Harmonic Minor");
  scalesDropdown.option("Whole Tone");
  scalesDropdown.option("Octatonic");
  scalesDropdown.changed(changeScale);

  instrumentDropdown = createSelect();
  instrumentDropdown.option("Select an Instrument:");
  instrumentDropdown.option("Comb");
  instrumentDropdown.option("Piano");
  instrumentDropdown.option("Bells");
  instrumentDropdown.changed(changeInstrument);
  positionDropdownMenus();

  for (let i = 0; i < totalVerticalPoints; i++) {
    let y = map(
      i,
      0,
      totalVerticalPoints,
      cylinderHeight / 2,
      -cylinderHeight / 2
    );
    let rowCoordinates = [];
    let rowColors = [];
    let rowNotes = [];

    for (let j = 0; j < totalHorizontalPoints; j++) {
      let angle = map(j, 0, totalHorizontalPoints, 0, TWO_PI);

      let x = radius * Math.cos(angle);
      let z = radius * Math.sin(angle);

      rowCoordinates.push({ x, y, z });
      rowColors.push(color(0, 0, 0, 35)); // Initialize with light grey
      rowNotes.push(false); // Initialize as not filled
    }

    cylinderCoordinates.push(rowCoordinates);
    colors.push(rowColors);
    notes.push(rowNotes);
  }
}

function draw() {
  background(250);

  if (isPlaying) {
    let elapsedTime = millis() - startTime;
    rotationalValue = (elapsedTime % totalDuration) / totalDuration;
    angleY = rotationalValue * TWO_PI;
  }

  calculateCylinderY();
  drawfixedHorizontalLines(cylinderYCoordinates);

  const scaleFactorBase = 400;
  const scaleFactorOffset = 300;

  for (let i = 0; i < cylinderCoordinates.length; i++) {
    for (let j = 0; j < cylinderCoordinates[i].length; j++) {
      let coords = cylinderCoordinates[i][j];
      let { x, y, z } = coords;
      let projection = SphericalProjection(x, y, z, angleX, angleY, angleZ);
      let scaleFactor = scaleFactorBase / (projection.z + scaleFactorOffset);
      let projectedX = projection.x * scaleFactor;
      let projectedY = projection.y * scaleFactor;

      let alpha = map(scaleFactor, 0.9, 2, 0, 255);

      if (notes[i][j]) {
        fill(0, alpha);
      } else {
        noFill();
      }

      stroke(0, alpha);
      strokeWeight(0.7);

      ellipse(projectedX, projectedY, 8, 8);
    }
  }
}

function SphericalProjection(x, y, z, angleX, angleY, angleZ) {
  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);
  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);
  const cosZ = Math.cos(angleZ);
  const sinZ = Math.sin(angleZ);

  let tempX = x * cosZ - y * sinZ;
  let tempY = x * sinZ + y * cosZ;
  x = tempX;
  y = tempY;

  tempX = x * cosY + z * sinY;
  let tempZ = -x * sinY + z * cosY;
  x = tempX;
  z = tempZ;

  tempY = y * cosX - z * sinX;
  tempZ = y * sinX + z * cosX;

  return { x: tempX, y: tempY, z: tempZ };
}

function playSound(buffer) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.25; // volume multiplier
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}

function createPlayButton() {
  playButton = createImg("images/play_icon.jpg", "▶");
  playButton.size(45, 45);
  playButton.touchStarted(togglePlayback);
  positionplayButton();
}

function playAllNotes() {
  if (timeoutIds.length > 0) {
    return; // Exit if the loop is already running
  }
  isPlaying = true;
  let startIndex = 18; // Playback starting index

  let loopFunction = () => {
    for (let j = 0; j < notes[0].length; j++) {
      let adjustedIndex = (j + startIndex) % notes[0].length;
      let timeoutId = setTimeout(() => {
        if (!isPlaying) {
          clearTimeouts();
          return;
        }
        for (let i = 0; i < notes.length; i++) {
          if (notes[i][adjustedIndex]) {
            let bufferIndex = scaleMappings[i];
            playSound(audioBuffers[bufferIndex]);
            changeLineColor(i);
          }
        }
      }, j * note_duration);
      timeoutIds.push(timeoutId);
    }

    if (isPlaying) {
      let timeoutId = setTimeout(loopFunction, notes[0].length * note_duration); // Loop after one iteration
      timeoutIds.push(timeoutId);
    }
  };
  loopFunction();
}

async function togglePlayback() {
  if (!isPlaying) {
    unmapped_noteDuration = durationSlider.value();
    note_duration = map(unmapped_noteDuration, 200, 1000, 600, 50);

    totalDuration = note_duration * totalHorizontalPoints;
    if (angleY != 0) {
      await smoothResetRotation();
    }

    isPlaying = true;
    clearButton.attribute("src", "images/bin_greyed.jpg");
    randomButton.attribute('src', 'images/random_button_disabled.jpg');
    startTime = millis();
    playAllNotes();
    playButton.attribute("src", "images/stop_icon.jpg");
    durationSlider.attribute("disabled", "");  
  } else {
    // Stop
    isPlaying = false;
    clearButton.attribute("src", "images/bin_icon.jpg");
    randomButton.attribute('src', 'images/random_button.jpg');
    clearTimeouts();
    playButton.attribute("src", "images/play_icon.jpg");
    durationSlider.removeAttribute("disabled");
    smoothResetRotation();
  }
}

function clearTimeouts() {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIds = [];
}

function smoothResetRotation() {
  return new Promise((resolve) => {
    let startX = angleX;
    let startY = angleY;
    let startZ = angleZ;
    let startValue = rotationalValue;

    let startTime = millis();
    let targetY = Math.round(startY / TWO_PI) * TWO_PI;

    function animate() {
      let currentTime = millis();
      let elapsedTime = currentTime - startTime;
      let progress = elapsedTime / 500;

      if (progress < 1) {
        angleX = lerp(startX, 0, progress);
        angleY = lerp(startY, targetY, progress);
        angleZ = lerp(startZ, 0, progress);
        rotationalValue = lerp(startValue, 0, progress);
        requestAnimationFrame(animate);
      } else {
        angleX = 0;
        angleY = targetY;
        angleZ = 0;
        rotationalValue = 0;
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

function changeLineColor(lineIndex) {
  lineColors[lineIndex] = activeLineColor;
  setTimeout(() => {
    lineColors[lineIndex] = defaultLineColor;
  }, note_duration / 2);
}

function clearNotes() {
  if (isPlaying) {
    return; // Do nothing if isPlaying is true
  }  
  colors = [];
  notes = [];
  for (let i = 0; i < totalVerticalPoints; i++) {
    let rowColors = [];
    let rowNotes = [];
    for (let j = 0; j < totalHorizontalPoints; j++) {
      rowColors.push(color(0, 0, 0, 35));
      rowNotes.push(false);
    }
    colors.push(rowColors);
    notes.push(rowNotes);
    individualInstrumentArray = new Array(37).fill(1);
    loadAudioSet(individualInstrumentArray);
  }
}

function addNote() {
  if (totalVerticalPoints < 15) {
    totalVerticalPoints++;
    updateArraysForVerticalPoints();
  }
}

function removeNote() {
  if (totalVerticalPoints > 3) {
    totalVerticalPoints--;
    updateArraysForVerticalPoints();
  }
}

function updateArraysForVerticalPoints() {
  let newCylinderCoordinates = [];
  let newColors = [];
  let newNotes = [];
  let newLineColors = Array(totalVerticalPoints).fill(defaultLineColor);

  const radius = windowWidth * 0.2;
  const cylinderHeight = windowHeight * 0.4;
  const halfCylinderHeight = cylinderHeight / 2;
  const totalHorizontalPointsReciprocal = 1 / totalHorizontalPoints;
  const totalVerticalPointsReciprocal = 1 / totalVerticalPoints;

  for (let i = 0; i < totalVerticalPoints; i++) {
    const y =
      halfCylinderHeight - i * cylinderHeight * totalVerticalPointsReciprocal;
    let rowCoordinates = [];
    let rowColors = [];
    let rowNotes = [];

    for (let j = 0; j < totalHorizontalPoints; j++) {
      const angle = j * TWO_PI * totalHorizontalPointsReciprocal;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      rowCoordinates.push({ x, y, z });

      if (i < cylinderCoordinates.length && j < cylinderCoordinates[i].length) {
        rowColors.push(colors[i][j]);
        rowNotes.push(notes[i][j]);
      } else {
        rowColors.push(color(0, 0, 0, 35));
        rowNotes.push(false);
      }
    }

    newCylinderCoordinates.push(rowCoordinates);
    newColors.push(rowColors);
    newNotes.push(rowNotes);
  }

  cylinderCoordinates = newCylinderCoordinates;
  colors = newColors;
  notes = newNotes;
  lineColors = newLineColors;
}

function changeScale() {
  // Handle the change in scale selection here
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== "disabled") {
    // Process selected scale
    if (selectedScale === "Major Pentatonic") {
      // pentatonic
      scaleMappings = majorPentatonic;
    }
    if (selectedScale === "Minor Pentatonic") {
      // pentatonic
      scaleMappings = minorPentatonic;
    }
    if (selectedScale === "Major scale") {
      scaleMappings = ionian;
    }
    if (selectedScale === "Dorian mode") {
      scaleMappings = dorian;
    }
    if (selectedScale === "Mixolydian mode") {
      scaleMappings = mixolydian;
    }
    if (selectedScale === "Aeolian mode") {
      scaleMappings = aeolian;
    }
    if (selectedScale === "Chromatic") {
      scaleMappings = chromatic;
    }
    if (selectedScale === "Harmonic Minor") {
      scaleMappings = harmonicMinor;
    }
    if (selectedScale === "Whole Tone") {
      scaleMappings = wholeTone;
    }
    if (selectedScale === "Octatonic") {
      scaleMappings = octatonic;
    }
  }
}

function positionclearButton() {
  clearButton.position(windowWidth - 50, 80);
}

function positionrandomButton() {
  randomButton.position(windowWidth - 50, 140);
}

function positionMetroIcon() {
  metroImage.position(65, 20);
}

function positionplayButton() {
  playButton.position(20, 20);
}

function positionplus_minus_Buttons() {
  addButton.position(windowWidth - 50, 20);
  removeButton.position(windowWidth - 100, 20);
}

function positionDurationSlider() {
  durationSlider.position(115, 31);
}

function positionDropdownMenus() {
  scalesDropdown.position(windowWidth / 2, windowHeight - 25);
  instrumentDropdown.position(10, windowHeight - 25);
}

function calculateCylinderY() {
  // Calculate y-coordinates of cylinder rows
  cylinderYCoordinates = [];
  for (let i = 0; i < cylinderCoordinates.length; i++) {
    if (cylinderCoordinates[i].length > 0) {
      cylinderYCoordinates.push(cylinderCoordinates[i][0].y);
    }
  }
  cylinderYCoordinates.sort((a, b) => b - a);
}

function drawfixedHorizontalLines(cylinderYCoordinates) {
  for (let i = 0; i < cylinderYCoordinates.length; i++) {
    stroke(lineColors[i]);
    strokeWeight(1 * pixelDensity());
    let y = cylinderYCoordinates[i] * 1.4;
    let rectStartX = -windowWidth / 2.4;
    let rectEndX = -windowWidth / 3.5;
    let rectWidth = rectEndX - rectStartX;

    noStroke();
    fill(lineColors[i]);
    rect(rectStartX, y - 0.5, rectWidth, 5);

    let buttonSize = 20;
    let buttonX = -windowWidth / 2.5 - 10;
    let buttonY = y;
    ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
    let originalIndex = scaleMappings[i];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    fill(ellipseColors[colIndex]);
    stroke(lineColors[i]);
    strokeWeight(0);
    ellipse(buttonX, buttonY, buttonSize, buttonSize);
  }
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
    isDragging = false; // Initially not dragging
    startX = touches[0].x;
    startY = touches[0].y;
    previousTouchX = startX;
    previousTouchY = startY;
  }
}

function touchMoved() {
  if (touches.length > 0 && touches[0].y > canvasTopBoundary) {
    isDragging = true;
    let currentTouchX = touches[0].x;
    let currentTouchY = touches[0].y;
    let deltaX = currentTouchX - previousTouchX;
    let deltaY = currentTouchY - previousTouchY;
    angleY -= deltaX * 0.008;
    rotationalValue = (angleY / TWO_PI) % 1;
    previousTouchX = currentTouchX;
    previousTouchY = currentTouchY;
  }
}

function touchEnded() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (typeof startX !== "undefined" && typeof startY !== "undefined") {
      // Calculate distance moved during touch
      let dx = previousTouchX - startX;
      let dy = previousTouchY - startY;
      let touchMovedDistance = Math.sqrt(dx * dx + dy * dy);

      if (!isDragging && touchMovedDistance < touchThreshold) {
        let transformedTouchX = startX - width / 2;
        let transformedTouchY = startY - height / 2;
        let buttonClicked = false;

        for (let btn of ellipseButtons) {
          let d = dist(transformedTouchX, transformedTouchY, btn.x, btn.y);
          if (d < btn.size / 2) {
            updateIndividualInstrumentArray(btn.id);
            buttonClicked = true;
          }
        }
        if (!buttonClicked) {
          handleNoteClick();
        }
      }
      startX = undefined;
      startY = undefined;
    }
  }, 100); // debounce
}

function handleNoteClick() {
  translate(width / 2, height / 2);
  let nearestPoint = null;
  let nearestDistance = Infinity;

  for (let i = 0; i < cylinderCoordinates.length; i++) {
    for (let j = 0; j < cylinderCoordinates[i].length; j++) {
      let coords = cylinderCoordinates[i][j];
      let { x, y, z } = coords;
      let projectionMath = SphericalProjection(x, y, z, angleX, angleY, angleZ);
      let scaleFactor = 400 / (projectionMath.z + 300);
      let projectedX = projectionMath.x * scaleFactor;
      let projectedY = projectionMath.y * scaleFactor;

      let d = dist(
        mouseX - width / 2,
        mouseY - height / 2,
        projectedX,
        projectedY
      );

      if (d < nearestDistance && d < 20) {
        // pixel radius (20)
        let alphaThreshold = 100;
        let alphaValue = map(scaleFactor, 0.9, 2, 0, 255);
        if (alphaValue >= alphaThreshold) {
          nearestPoint = { x: projectedX, y: projectedY, i, j };
          nearestDistance = d;
        }
      }
    }
  }
  if (nearestPoint !== null) {
    let { i, j } = nearestPoint;
    if (notes[i][j]) {
      colors[i][j] = color(0, 0, 0, 35);
      notes[i][j] = false;
    } else {
      colors[i][j] = color(0, 0, 0);
      notes[i][j] = true;
    }
  }
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
}

function updateIndividualInstrumentArray(indexToUpdate) {
  clearTimeout(debounceTimerArray);
  debounceTimerArray = setTimeout(() => {
    if (
      indexToUpdate >= 0 &&
      indexToUpdate < individualInstrumentArray.length
    ) {
      indexToUpdate = scaleMappings[indexToUpdate];
      individualInstrumentArray[indexToUpdate] =
        (individualInstrumentArray[indexToUpdate] % 3) + 1;
      loadAudioSet(individualInstrumentArray);
    }
  }, 50); // debounce
}

function changeInstrument() {
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== "disabled") {
    if (selectedInstrument === "Comb") {
      individualInstrumentArray = new Array(37).fill(1);
    }
    if (selectedInstrument === "Piano") {
      individualInstrumentArray = new Array(37).fill(2);
    }
    if (selectedInstrument === "Bells") {
      individualInstrumentArray = new Array(37).fill(3);
    }
    console.log("Selected instrument:", selectedInstrument);
    loadAudioSet(individualInstrumentArray);
  }
}

function randomiseEverything() {
  if (!isPlaying) {  
  
    randomTempo = randomInt(300, 1000); // avoid slowest option
    durationSlider.value(randomTempo);

    // start with number of notes
    totalVerticalPoints = int(random(10)) + 3;

    randomScale = random(["Major Pentatonic", "Major Pentatonic", "Minor Pentatonic", "Minor Pentatonic", "Major scale", "Dorian mode", "Mixolydian mode", "Aeolian mode", "Chromatic", "Harmonic Minor", "Whole Tone", "Octatonic"]);
    scalesDropdown.selected(randomScale);
    changeScale();

    updateArraysForVerticalPoints();  

    // individ. instruments
    individualInstrumentArray = [];
    for (let i = 0; i < 37; i++) {
    individualInstrumentArray.push(randomInt(1, 3));
  }
    loadAudioSet(individualInstrumentArray);  

    randomDensity = random(0.4) + 0.55;
    print(randomDensity);

    // Randomize the notes and colors with no consecutive notes on the same row
    for (let i = 0; i < totalVerticalPoints; i++) {
      let previousNote = false;
      for (let j = 0; j < totalHorizontalPoints; j++) {
        if (previousNote) {
          notes[i][j] = false;
          previousNote = false;
        } else {
          notes[i][j] = Math.random() >= randomDensity; // 1/3 chance to create a note
          previousNote = notes[i][j];
        }

        // Set color based on the random note
        if (notes[i][j]) {
          colors[i][j] = color(Math.random() * 255, Math.random() * 255, Math.random() * 255); // Random color for a note
        } else {
          colors[i][j] = color(0, 0, 0, 35); // Default color for no note
        }
      }
    }
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function popupHelp() {
  if (helpDiv) {
    helpDiv.remove();
  }

  helpDiv = createDiv();
  helpDiv.position(50, 50);
  helpDiv.style('background-color', '#f9f9f9');
  helpDiv.style('border', '1px solid #000');
  helpDiv.style('padding', '10px');
  helpDiv.style('z-index', '10');
  helpDiv.style('max-width', '80%');
  helpDiv.style('font-family', 'Arial, Helvetica, sans-serif');

  helpDiv.html(`
    <div style="position: relative; padding: 10px;">
      <ul style="margin: 0; padding: 0; list-style: none; line-height: 1.8;">
        <li>• Rotate the cylinder by dragging</li>
        <li>• Click to create a pin</li>
        <li>• Click an existing pin to delete it</li>
        <li>• Press + and - to add or remove rows</li>
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

  helpDiv.elt.addEventListener('touchstart', (e) => e.stopPropagation());
  helpDiv.elt.addEventListener('touchmove', (e) => e.stopPropagation());
  helpDiv.elt.addEventListener('touchend', (e) => e.stopPropagation());

  let closeButton = select('#closeHelp');
  closeButton.mousePressed(closeHelp);
}

function closeHelp() {
  if (helpDiv) {
    helpDiv.remove();
  }
}
