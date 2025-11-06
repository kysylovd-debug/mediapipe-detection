import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const demosSection = document.getElementById("demos");
let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "360px";
const videoWidth = "480px";

let keySequence = "";
const secretCode = "ISMT";

document.addEventListener("keypress", (e) => {
  const key = e.key.toUpperCase();
  keySequence += key;
  if (keySequence.length > secretCode.length)
    keySequence = keySequence.slice(-secretCode.length);
  if (keySequence === secretCode) {
    unlockSecret();
    keySequence = "";
  }
});

function unlockSecret() {
  demosSection.classList.remove("invisible");
  enableWebcamButton.disabled = false;
  alert("Détection activée !");
}

const createGestureRecognizer = async () => {
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
  demosSection.classList.remove("invisible");
};
createGestureRecognizer();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput = document.getElementById("gesture_output");
enableWebcamButton = document.getElementById("webcamButton");
enableWebcamButton.disabled = true; // désactivé jusqu'à ISMT

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

if (hasGetUserMedia()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() n'est pas supporté par votre navigateur");
}

async function enableCam() {
  if (!gestureRecognizer) {
    alert("Veuillez patienter le chargement du modèle");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "ENABLE PREDICTIONS";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "DISABLE PREDICTIONS";
  }

  const constraints = {
    video: true
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  video.play();
  video.addEventListener("loadeddata", predictWebcam);
}

let lastVideoTime = -1;
let results;

async function predictWebcam() {
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }
  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = await gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const drawingUtils = new DrawingUtils(canvasCtx);

  canvasElement.style.height = videoHeight;
  video.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  video.style.width = videoWidth;

  if (results.landmarks) {
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2
      });
    }
  }

  if (results.gestures.length > 0) {
    gestureOutput.style.display = "block";
    gestureOutput.style.width = videoWidth;
    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = parseFloat(
      results.gestures[0][0].score * 100
    ).toFixed(2);
    const handedness = results.handednesses[0][0].displayName;
    gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;

    // Exemple : ouvre les liens en fonction des gestes
    // Ici à personnaliser selon tes besoins
    // if (categoryName === "Closed_Fist") ouvrirClassroomOnglets();
  } else {
    gestureOutput.style.display = "none";
  }
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}

function ouvrirClassroomOnglets() {
  const classroomUrls = [
    "https://classroom.google.com/u/0/c/MTExMTExMTExMTEx", // Remplace avec vrais liens
    "https://classroom.google.com/u/0/c/MTExMTExMTExMTEx",
    "https://classroom.google.com/u/0/c/MTExMTExMTExMTEx"
  ];

  classroomUrls.forEach((url) => {
    window.open(url, "_blank");
  });
}
