let peerConnection;
JSON.stringify;
let localStream;
let remoteStream;
let socketIo;
let SDPOffer;
let SDPOfferFromOtherSite;
let SDPAnswer;

let ICEcandidate;

let count = 1;
console.log("Test.js Script loded");
const socket = io("/");

const registerSocketEvents = (socket) => {
  socket.on("connect", () => {
    socketIo = socket;
    console.log("succesfully connected to socket.io server");
    console.log(socket.id);
    document.title = "Socketid -> " + socket.id;

    const personalCodeParagraph = document.getElementById(
      "personal_code_paragraph"
    );
    personalCodeParagraph.innerHTML = socket.id;
  });

  // handle offer event sent from app.js
  socket.on("OfferSent", (data) => {
    document.getElementById("offer-sdp").value = data.data;
  });

  // handle SDP answr event sent from app.js
  socket.on("AnswerSent", (data) => {
    document.getElementById("answer-sdp").value = data.data;
    SdpConet();
  });

  //  Handle AutoSdp Offer from Remote client
  socket.on("AutoSdpOfferRemote", async (data) => {
    await createAnswer();
  });
};

//  Auto Conect
const AutoSdpConect = async () => {
  ///
  await createOffer();
  await testSendOffer();
  socketIo.emit("AutoSdpOfferSent", socket.id);
};

// Sending offer-sdp  Event to app.ja
const testSendOffer = async () => {
  const sdpOfferData = {
    // data: document.getElementById("offer-sdp").value,
    data: SDPOffer,
    localSocketId: socket.id,
  };
  console.log("testSendOffer =>", testSendOffer);
  socketIo.emit("testSdpOffer", sdpOfferData);
};

// Sending Answer-sdp  Event to app.ja
const testSendSdpAnswer = async () => {
  const sdpAnswerData = {
    data: document.getElementById("answer-sdp").value,
    localSocketId: socket.id,
  };

  socketIo.emit("testSdpAnswer", sdpAnswerData);
};

registerSocketEvents(socket);

let noservers = [];
let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;
};

//   CREATE Offer
let createOffer = async () => {
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Event listner for the remote streem
  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Event listener for ICE candidate from Stun server
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      document.getElementById("offer-sdp").value = JSON.stringify(
        peerConnection.localDescription
      );
    }
  };

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  document.getElementById("offer-sdp").value = JSON.stringify(offer);
  SDPOffer = JSON.stringify(offer);
};

//  Create ANSWER
let createAnswer = async () => {
  peerConnection = new RTCPeerConnection(servers);
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Event listner for the remote streem
  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Event listener for ICE candidate from Stun server
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      document.getElementById("answer-sdp").value = JSON.stringify(
        peerConnection.localDescription
      );
      console.log(
        "event =>",
        count,
        JSON.stringify(peerConnection.localDescription)
      );
      count++;
    }
  };

  let offer = document.getElementById("offer-sdp").value;

  if (!offer) return alert("Retrieve offer from peer first...");
  offer = JSON.parse(offer);
  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("Answer +++>", JSON.stringify(answer));
  document.getElementById("answer-sdp").value = JSON.stringify(answer);

  setTimeout(() => {
    testSendSdpAnswer();
  }, 1000); // Delay
};

let SdpConet = async () => {
  let answer = document.getElementById("answer-sdp").value;
  if (!answer) return alert("Retrieve answer from peer first...");

  answer = JSON.parse(answer);
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

init();
document.getElementById("create-offer").addEventListener("click", createOffer);

document
  .getElementById("create-answer")
  .addEventListener("click", createAnswer);
document.getElementById("send-offer").addEventListener("click", testSendOffer);
document
  .getElementById("send-answer")
  .addEventListener("click", testSendSdpAnswer);
document.getElementById("AutoConect").addEventListener("click", AutoSdpConect);
