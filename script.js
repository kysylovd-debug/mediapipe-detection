import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";

// Vérifie compatibilité Chrome uniquement (exemple)
testSupport([{client: 'Chrome'}]);

function testSupport(supportedDevices) {
  const deviceDetector = new DeviceDetector();
  const detectedDevice = deviceDetector.parse(navigator.userAgent);

  let isSupported = false;
  for (const device of supportedDevices) {
    if (device.client !== undefined) {
      const re = new RegExp(`^${device.client}$`);
      if (!re.test(detectedDevice.client.name)) continue;
    }
    if (device.os !== undefined) {
      const re = new RegExp(`^${device.os}$`);
      if (!re.test(detectedDevice.os.name)) continue;
    }
    isSupported = true;
    break;
  }
  if (!isSupported) {
    alert(`Ce démo sur ${detectedDevice.client.name}/${detectedDevice.os.name} risque de ne pas bien marcher...`);
  }
}

// Mot de passe
let keySequence = '';
const secretCode = 'ISMT';

document.addEventListener('keypress', (e) => {
  const key = e.key.toUpperCase();
  keySequence += key;
  if (keySequence.length > secretCode.length)
    keySequence = keySequence.slice(-secretCode.length);
  if (keySequence === secretCode) {
    unlockSecret();
    keySequence = '';
  }
});

function unlockSecret() {
  document.getElementById('secretSection').style.display = 'block';
  let notification = document.getElementById('notification');
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
    startFaceDetection();
  }, 1500);
}

function startFaceDetection() {
  // On ne montre plus le flux vidéo, seulement le canvas
  const canvas = document.getElementById('output');
  const ctx = canvas.getContext('2d');

  const video = document.createElement('video');
  video.setAttribute('autoplay', true);
  video.setAttribute('muted', true);
  video.setAttribute('playsinline', true);
  video.width = 640;
  video.height = 480;
  video.style.display = 'none';
  document.body.appendChild(video);

  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    selfieMode: true
  });

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    selfieMode: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  // États de stockage des derniers résultats
  let latestFaceResults = null;
  let latestHandResults = null;

  // Fonction pour dessiner en fusion
  function drawResults() {
    if (!latestFaceResults && !latestHandResults) return;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (latestFaceResults) {
      ctx.drawImage(latestFaceResults.image, 0, 0, canvas.width, canvas.height);
    } else if (latestHandResults) {
      ctx.drawImage(latestHandResults.image, 0, 0, canvas.width, canvas.height);
    }

    if (latestFaceResults && latestFaceResults.multiFaceLandmarks) {
      ctx.fillStyle = 'red';
      latestFaceResults.multiFaceLandmarks.forEach(landmarks => {
        landmarks.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    }

    if (latestHandResults && latestHandResults.multiHandLandmarks) {
      ctx.fillStyle = 'blue';
      latestHandResults.multiHandLandmarks.forEach(landmarks => {
        landmarks.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    }

    ctx.restore();
  }

  faceMesh.onResults(results => {
    latestFaceResults = results;
    drawResults();
  });

  hands.onResults(results => {
    latestHandResults = results;
    drawResults();
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      await faceMesh.send({image: video});
      await hands.send({image: video});
    },
    width: 640,
    height: 480
  });
  camera.start();
}

