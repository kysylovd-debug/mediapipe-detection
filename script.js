import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.createElement('video');
video.style.display = "none";
document.body.appendChild(video);

const canvasElement = document.createElement('canvas');
canvasElement.id = "output";
canvasElement.width = 480;
canvasElement.height = 360;
document.body.appendChild(canvasElement);
const canvasCtx = canvasElement.getContext('2d');

const gestureOutput = document.createElement('div');
gestureOutput.id = "gesture_output";
gestureOutput.style.position = "fixed";
gestureOutput.style.bottom = "20px";
gestureOutput.style.left = "20px";
gestureOutput.style.background = "rgba(0,0,0,0.7)";
gestureOutput.style.color = "white";
gestureOutput.style.padding = "10px";
gestureOutput.style.borderRadius = "5px";
gestureOutput.style.fontFamily = "Arial";
gestureOutput.style.zIndex = "1000";
document.body.appendChild(gestureOutput);

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;
let lastVideoTime = -1;

// Chargement du modèle et initialisation
async function createGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: runningMode
  });
  startWebcam();
}

async function startWebcam() {
  if (navigator.mediaDevices.getUserMedia) {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    video.srcObject = stream;
    video.play();
    webcamRunning = true;
    predictWebcam();
  } else {
    alert("getUserMedia() n'est pas supporté par ce navigateur.");
  }
}

async function predictWebcam() {
  if (gestureRecognizer && webcamRunning) {
    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const results = await gestureRecognizer.recognizeForVideo(video, nowInMs);

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      const drawingUtils = new DrawingUtils(canvasCtx);
      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(
            landmarks,
            GestureRecognizer.HAND_CONNECTIONS,
            { color: "#00FF00", lineWidth: 5 }
          );
          drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
        }
      }
      if (results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        let categoryName = results.gestures[0][0].categoryName;
        let categoryScore = (results.gestures[0][0].score * 100).toFixed(2);
        let handedness = results.handednesses[0][0].displayName;
        gestureOutput.innerText = `Gesture: ${categoryName}\nConfidence: ${categoryScore}%\nHandedness: ${handedness}`;

        // Exemple : Si poing fermé détecté, ouvrir onglets
        if (categoryName === "Closed_Fist") {
          ouvrirClassroomOnglets();
        }
      } else {
        gestureOutput.style.display = "none";
      }
    }
    window.requestAnimationFrame(predictWebcam);
  }
}

function ouvrirClassroomOnglets() {
  const classroomUrls = [
    "https://classroom.google.com/u/1/c/Nzk5ODQxMjgxMzMz",  // Remplace par vrai liens
    "https://classroom.google.com/u/1/c/Nzc0MjcwNDI0NDYz",
    "https://classroom.google.com/u/1/c/NzA4MzI0OTk0OTEw"
  ];
  classroomUrls.forEach(url => window.open(url, '_blank'));
}

createGestureRecognizer();
