p5.disableFriendlyErrors = true;
let isPlaying = false;
let currentAngle = 0;
let targetAngle = 0;
let easingFactor = 0.05;
let isEasing = false;
let debounceTimer;
let debounceTimerArray;
let loadedInstrumentSetBuffers = {};
let buttonSize = 20;
let ellipseButtons = [];
let ellipseColors = [
  [255, 228, 209], // Red
  [203, 237, 209], // Green
  [167, 234, 255], // Blue
];

let lastState = '';

let helpButton;
let helpDiv;

let randomButton;

let buttonGraphics;
let gapIndex = 9;
let individualInstrumentArray = new Array(37).fill(1);
let startX, startY;
let circleCenterX, circleCenterY, circleRadius;
let points;
let numRings = 7;
let numSegments = 16;
let duration = 550;

let audioBuffers = [];
let timeouts = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;
let startTime;
let playButton;
let clearButton;
let durationSlider;
let timeoutIds = [];
let graphics;

// Loading audio
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

function preload() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
  audioContext.suspend().then(() => {
    console.log('AudioContext state in preload:', audioContext.state);
  });  
}

// Load audio set
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

// default scale mapping
let scaleMappings = majorPentatonic;

function setup() {
  audioContext.suspend().then(() => {
    console.log('AudioContext suspended in setup:', audioContext.state);
  }).catch((err) => {
    console.error('Error suspending AudioContext:', err);
  });  
  
  createCanvas(windowWidth, windowHeight);
  window.addEventListener("resize", resizeCanvasToWindow);
  frameRate(60);
  buttonGraphics = createGraphics(windowWidth, windowHeight);
  circleCenterX = windowWidth / 2;
  circleCenterY = windowHeight / 2;
  let baseRadius = Math.min(windowWidth, windowHeight) * 0.45;
  circleRadius = baseRadius;
  initializePointsArray();
  createPlayButton();
  createClearButton();

  scalesDropdown = createSelect();
  scalesDropdown.option("Select a Scale:", "");
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
  instrumentDropdown.option("Select an Instrument:", "");
  instrumentDropdown.option("Comb");
  instrumentDropdown.option("Piano");
  instrumentDropdown.option("Bells");
  instrumentDropdown.changed(changeInstrument);

  positionDropdownMenus();
  
  randomButton = createImg("images/random_button.jpg", "R")
  randomButton.size(45, 45);
  randomButton.touchStarted(randomiseEverything);
  positionrandomButton();    

  let addButton = createImg("images/plus_ring.jpg", "+");
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);
  addButton.mousePressed(() => {
    if (numRings < 17) {
      numRings++;
      initializePointsArray();
      drawConcentricCircles();
      ellipseButtons = [];
      drawButtonEllipses();
    }
  });

  let removeButton = createImg("images/minus_ring.jpg", "-");
  removeButton.size(45, 45);
  removeButton.position(
    windowWidth - 60 - removeButton.width - addButton.width,
    30
  );
  removeButton.mousePressed(() => {
    if (numRings > 6) {
      numRings--;
      initializePointsArray();
      drawConcentricCircles();
      ellipseButtons = [];
      drawButtonEllipses();
    }
  });

  metroImage = createImg("images/metro_icon.jpg", "tempo");
  metroImage.size(45, 45);
  metroImage.position(10 + playButton.width, 30);
  
  helpButton = createImg('images/help_icon.jpg', '?');
  helpButton.size(45,45);
  helpButton.position(5, windowHeight - 75);
  helpButton.touchStarted(popupHelp);   

  durationSlider = createSlider(100, 1000, 550);
  durationSlider.position(10 + playButton.width + metroImage.width, 40);
  durationSlider.style("width", "60px");
  durationSlider.value(550);
  durationSlider.addClass("mySliders");

  graphics = createGraphics(windowWidth, windowHeight);
  drawConcentricCircles();
  drawButtonEllipses();
}

function draw() {
  background(250);

  if (isPlaying) {
    duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);

    let elapsedTime = millis() - startTime;
    let totalRotationDuration = numSegments * duration;
    currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI;
    targetAngle = currentAngle;
  } else if (isEasing) {
    currentAngle += (0 - currentAngle) * easingFactor;
    if (abs(currentAngle) < 0.001) {
      currentAngle = 0;
      isEasing = false;
      playButton.removeAttribute("disabled");
    }
  }

  image(graphics, 0, 0);
  image(buttonGraphics, 0, 0);

  push();
  translate(circleCenterX, circleCenterY);
  rotate(currentAngle);
  translate(-circleCenterX, -circleCenterY);

  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;
  drawButtonEllipses();

  let segmentAngles = new Array(numSegments);
  for (let j = 0; j < numSegments; j++) {
    segmentAngles[j] = atan2(Math.sin(j * angleIncrement), Math.cos(j * angleIncrement)) + HALF_PI;
  }

  // Grey segment
  let arcRadius = circleRadius * 1.06 + radiusIncrement * numRings;
  noStroke();
  fill(90, 90, 90, 15);
  arc(circleCenterX, circleCenterY, arcRadius, arcRadius, 3.45, 3.8);

  // Draw segments
  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      if (j === gapIndex) continue;

      let quantizedX = circleCenterX + quantizedRadius * Math.cos(j * angleIncrement);
      let quantizedY = circleCenterY + quantizedRadius * Math.sin(j * angleIncrement);

      if (points[i][j]) {
        push();
        translate(quantizedX, quantizedY);
        rotate(segmentAngles[j]);
        fill(0, 170);
        noStroke();
        rect(0, 0, radiusIncrement * 0.6, radiusIncrement / 2);
        pop();
      }
    }
  }
  pop();
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
    let d = dist(touchX, touchY, circleCenterX, circleCenterY);

    if (d <= circleRadius + 12) {
      let adjustedTouchX = touchX;
      let adjustedTouchY = touchY;

      if (isPlaying) {
        let elapsedTime = millis() - startTime;
        let totalRotationDuration = numSegments * duration;
        let currentAngle = -(elapsedTime % totalRotationDuration) / totalRotationDuration * TWO_PI;

        let cosAngle = Math.cos(-currentAngle);
        let sinAngle = Math.sin(-currentAngle);
        let dx = touchX - circleCenterX;
        let dy = touchY - circleCenterY;

        adjustedTouchX = cosAngle * dx - sinAngle * dy + circleCenterX;
        adjustedTouchY = sinAngle * dx + cosAngle * dy + circleCenterY;
      }

      let buttonClicked = false;
      for (let btn of ellipseButtons) {
        if (dist(touchX, touchY, btn.x, btn.y) < btn.size / 1.9) {
          updateIndividualInstrumentArray(btn.id);
          buttonClicked = true;
          break;
        }
      }

      if (!buttonClicked) {
        let [rIndex, aIndex] = getClosestQuantizedIndices(adjustedTouchX, adjustedTouchY);
        if (rIndex > 0) {
          points[rIndex][aIndex] = !points[rIndex][aIndex];
        }
      }
    }
  }
}

function getClosestQuantizedIndices(x, y) {
  let angleIncrement = TWO_PI / numSegments;
  let radiusIncrement = circleRadius / numRings;
  let minDistSq = Infinity;
  let closestRIndex, closestAIndex;
  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    for (let j = 0; j < numSegments; j++) {
      let quantizedAngle = j * angleIncrement;
      let cosAngle = Math.cos(quantizedAngle);
      let sinAngle = Math.sin(quantizedAngle);
      let quantizedX = circleCenterX + quantizedRadius * cosAngle;
      let quantizedY = circleCenterY + quantizedRadius * sinAngle;

      let dx = x - quantizedX;
      let dy = y - quantizedY;
      let distSq = dx * dx + dy * dy;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestRIndex = i;
        closestAIndex = j;
      }
    }
  }
  return [closestRIndex, closestAIndex];
}

function initializePointsArray(clear = false) {
  let newPoints = Array.from({ length: numRings + 1 }, (_, i) => 
    Array.from({ length: numSegments }, (_, j) => 
      !clear && points?.[i]?.[j] !== undefined ? points[i][j] : false
    )
  );
  points = newPoints;
}

function clearInstruments() {
  individualInstrumentArray = new Array(37).fill(1);
  loadAudioSet(individualInstrumentArray);
}

function playSound(buffer) {
  let source = audioContext.createBufferSource();
  source.buffer = buffer;
  let gainNode = audioContext.createGain();
  gainNode.gain.value = 0.2;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  source.start(0);
}

function createPlayButton() {
  playButton = createImg("images/play_icon.jpg", "▶");
  playButton.size(45, 45);
  playButton.position(10, 30);
  playButton.mousePressed(togglePlayback);
}

function createClearButton() {
  clearButton = createImg("images/bin_icon.jpg", "✖");
  clearButton.size(45, 45);
  clearButton.position(windowWidth - 50, 30);
  clearButton.mousePressed(() => {
    initializePointsArray(true);
    clearInstruments();
  });
}

function playAllNotes(startSegmentIndex) {
  if (timeoutIds.length > 0) {
    return;
  }
  isPlaying = true;
  let loopFunction = () => {
    for (let j = startSegmentIndex; j < numSegments + startSegmentIndex; j++) {
      let adjustedIndex = j % numSegments;
      if (adjustedIndex === gapIndex) continue;
      let timeoutId = setTimeout(() => {
        if (!isPlaying) {
          clearTimeouts();
          return;
        }
        for (let i = 3; i <= numRings; i++) {
          if (points[i][adjustedIndex]) {
            let bufferIndex = scaleMappings[i - 3];
            playSound(audioBuffers[bufferIndex]);
          }
        }
      }, (j - startSegmentIndex) * duration);
      timeoutIds.push(timeoutId);
    }
    if (isPlaying) {
      let timeoutId = setTimeout(loopFunction, numSegments * duration);
      timeoutIds.push(timeoutId);
    }
  };
  loopFunction();
}

function clearTimeouts() {
  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutIds = [];
}

function togglePlayback() {
  if (!isPlaying && !isEasing) {
    let duration_init = durationSlider.value();
    duration = map(duration_init, 100, 1000, 1000, 100);
    isPlaying = true;
    startTime = millis();
    playAllNotes(10); // index to start playing from
    playButton.attribute("src", "images/stop_icon.jpg");
    randomButton.attribute('src', 'images/random_button_disabled.jpg');
    durationSlider.attribute("disabled", "");
  } else if (isPlaying) {
    // Stop
    isPlaying = false;
    clearTimeouts();
    playButton.attribute("src", "images/play_icon.jpg");
    randomButton.attribute('src', 'images/random_button.jpg');
    durationSlider.removeAttribute("disabled");
    isEasing = true;
    playButton.attribute("disabled", "");
  }
}

function resizeCanvasToWindow() {
  resizeCanvas(windowWidth, windowHeight);
  circleCenterX = windowWidth / 2;
  circleCenterY = windowHeight / 2;
  let baseRadius = Math.min(windowWidth, windowHeight) * 0.4;
  circleRadius = baseRadius;
  innerCircleRadius = baseRadius * 0.6;
  redraw();
}

function drawConcentricCircles() {
  graphics.clear();
  graphics.noFill();
  graphics.stroke(0, 50);
  graphics.strokeWeight(0);
  graphics.ellipse(circleCenterX, circleCenterY, circleRadius * 2.1);

  // sketch border
  graphics.stroke(0, 50);
  graphics.strokeWeight(3);
  graphics.noFill();
  graphics.rect(0, 0, windowWidth, windowHeight);

  // rings
  graphics.strokeWeight(1);
  graphics.stroke(0, 25);
  let radiusIncrement = circleRadius / numRings;
  let offset = radiusIncrement / 5;
  let smallestRadius = radiusIncrement * 2.2;
  graphics.ellipse(circleCenterX, circleCenterY, smallestRadius * 2);

  for (let i = 3; i <= numRings; i++) {
    let currentRadius = i * radiusIncrement + offset;
    graphics.ellipse(circleCenterX, circleCenterY, currentRadius * 2);
  }
}

function changeScale() {
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== "disabled") {
    if (selectedScale === "Major Pentatonic") {
      scaleMappings = majorPentatonic;
    }
    if (selectedScale === "Minor Pentatonic") {
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
  }, 50); // debounce delay
}

function positionDropdownMenus() {
  scalesDropdown.position(windowWidth / 2, windowHeight - 25);
  instrumentDropdown.position(10, windowHeight - 25);
}

function drawButtonEllipses() {
  let radiusIncrement = circleRadius / numRings;
  let stationary_angle = -PI / 1.18;
  let offsetRadiusIncrement = radiusIncrement * -0.3;
  buttonGraphics.clear();
  ellipseButtons = [];

  for (let i = 3; i <= numRings; i++) {
    let quantizedRadius = i * radiusIncrement;
    let adjustedRadius = quantizedRadius + offsetRadiusIncrement;
    let angle = stationary_angle + i * 0.013;
    let cosAngle = cos(angle);
    let sinAngle = sin(angle);
    let buttonSize = radiusIncrement * 0.95;
    let buttonX = circleCenterX + adjustedRadius * cosAngle;
    let buttonY = circleCenterY + adjustedRadius * sinAngle;

    let originalIndex = scaleMappings[i - 3];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    buttonGraphics.fill(ellipseColors[colIndex]);
    ellipseButtons.push({
      id: i - 3,
      x: buttonX,
      y: buttonY,
      size: buttonSize,
    });
    buttonGraphics.noStroke();
    buttonGraphics.ellipse(buttonX, buttonY, buttonSize, buttonSize);
  }
}


function positionrandomButton() {
  randomButton.position(windowWidth - 50, 80);
}

function randomiseEverything() {
  if (!isPlaying) {
    randomTempo = randomInt(300, 1000); // avoid slowest option
    durationSlider.value(randomTempo);

    // start with number of notes
    numRings = int(random(10)) + 6;

    randomScale = random(["Major Pentatonic", "Major Pentatonic", "Minor Pentatonic", "Minor Pentatonic", "Major scale", "Dorian mode", "Mixolydian mode", "Aeolian mode", "Chromatic", "Harmonic Minor", "Whole Tone", "Octatonic"]);
    scalesDropdown.selected(randomScale);
    changeScale();  

    points = [];
    initializePointsArray();

    createRandomPoints(int(random(20)+20));


    drawConcentricCircles();
    ellipseButtons = [];
    drawButtonEllipses();  

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
  for (let n = 0; n < numPoints; n++) {
    let i = Math.floor(Math.random() * (numRings + 1));
    let j = Math.floor(Math.random() * numSegments);

    // Ensure no repeated adjacent points on the same row
    if (points[i][j] || (j > 0 && points[i][j - 1]) || (j < numSegments - 1 && points[i][j + 1])) {
      n--; // Skip this iteration and try again
      continue;
    }

    points[i][j] = true;
  }
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
        <li>• Click to create a point</li>
        <li>• Click an existing point to delete it</li>
        <li>• Press + and - to add or remove rings</li>
        <li>• Press ▶ to play your piece</li>
        <li>• Press the bin icon to reset</li>
        <li>• Change instrument with the menu or click the coloured circles</li>
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
