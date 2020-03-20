'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const stopButton = document.getElementById('stopButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

callButton.disabled = true;
stopButton.disabled = true;

startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
stopButton.addEventListener('click', stopFunc);

let startTime;
let localStream;
let pc1;
let pc2;

async function start() {
  console.log('Start');
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch(e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
}

async function call() {
  callButton.disabled = true;
  stopButton.disabled = false;
  console.log('Starting call');
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();

  const configuration = {};
  pc1 = new RTCPeerConnection(configuration);
  console.log('Created local peer connection object pc1');
  pc2 = new RTCPeerConnection(configuration);
  console.log('Created local peer connection object pc2');
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));

  pc2.addEventListener('track', gotRemoteStream);

  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));

  try {
    console.log('pc1 createOffer start');
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch(e) {
    console.log(`${e}`);
  }
}

async function onCreateOfferSuccess(desc) {
  //console.log(`Offer from pc1\n${desc.sdp}`);
  console.log('pc1 setLocalDescription start');

  try {
    await pc1.setLocalDescription(desc);
    onSetLocalSuccess(pc1);
  } catch(e) {
    console.log(`error setting description to pc1 ${error.toString()}`);
  }

  console.log('pc2 setRemoteDescription start');

  try {
    await pc2.setRemoteDescription(desc);
    onSetRemoteSuccess(pc2);
  } catch(e) {
    console.log(`error setting description to pc2 ${error.toString()}`);
  }

  console.log('pc2 createAnswer start');

  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch(e) {
    onCreateSessionDescriptionError(e);
  }
}

async function onCreateAnswerSuccess(desc) {
  //console.log(`Answer from pc2:\n${desc.sdp}`);
  console.log('pc2 setLocalDescription start');

  try {
    await pc2.setLocalDescription(desc);
    onSetLocalSuccess(pc2);
  } catch(e) {
    onSetSessionDescriptionError(e);
  }

  console.log('pc1 setRemoteDescription start');

  try {
    await pc1.setRemoteDescription(desc);
    onSetRemoteSuccess(pc1);
  } catch(e) {
    onSetSessionDescriptionError(e);
  }
}

async function gotRemoteStream(event) {
  remoteVideo.srcObject = event.streams[0];
}

function onSetLocalSuccess(pc) {
  console.log(`${getName(pc)} setLocalDescription complete`);
}    
    
function onSetRemoteSuccess(pc) {
  console.log(`${getName(pc)} setRemoteDescription complete`);
}        
    
function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}    

function onAddIceCandidateSuccess(pc) {
  console.log(`${getName(pc)} addIceCandidate success`);
}
    
function onAddIceCandidateError(pc, error) {
  //console.log(`${getName(pc)} failed to add ICE Candidate: ${error.toString()}`);
}

localVideo.addEventListener('loadedmetadata', function() {
  //console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  //console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

async function stopFunc() {
  console.log('Stop');
}

async function onIceCandidate(pc, event) {
  try {
    await (getOtherPc(pc).addIceCandidate(event.candidate));
    onAddIceCandidateSuccess(pc);
  } catch(e) {
    onAddIceCandidateError(pc, e);
  }

  //console.log(`${getName(pc)} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

localVideo.addEventListener('loadedmetadata', function() {
  //console.log(`Local video videoWidth: ${this.videoWidth}px, videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  //console.log(`Remote video videoWidth: ${this.videoWidth}px, videoHeight: ${this.videoHeight}px`);
});

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

