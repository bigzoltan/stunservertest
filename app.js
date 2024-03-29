const express = require("express");
const http = require("http");

const app = express();

const server = http.createServer(app);

const socket = require("socket.io");
const io = socket(server);

// Show express from which directory to start
// Serve the static HTML file
app.use(express.static("public"));
//app.use(express.static("node_modules/socket.io/client-dist"));

let connectedPeers = [];
let conectedPeersNicNames = [];

//app.get("/", (req, res) => {
//  res.sendFile(__dirname + "index.html");
//});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "test.html");
});

// Listen for socket connections
io.on("connection", (socket) => {
  console.log("A user connected");
  connectedPeers.push(socket.id);
  conectedPeersNicNames.push("Empty");
  console.log("Conected peers ->", connectedPeers);
  console.log("Conected Nick Names -> ", conectedPeersNicNames);
  connectedPeers.forEach(function (element) {
    io.to(element).emit("calleList-update", connectedPeers);
  });

  // //  testOffer
  socket.on("testSdpOffer", (data) => {
    console.log("SDP offer =>", data);
    console.log("Socket ID ->", data.localSocketId);

    connectedPeers.forEach(function (element) {
      if (element !== data.localSocketId) {
        io.to(element).emit("OfferSent", data);
        console.log("OfferSent Event sent to Socket ID ->", element);
      }
    });
  });

  // testSdpAnswer
  socket.on("testSdpAnswer", (data) => {
    console.log("SDP Answer =>", data);
    console.log("Socket ID ->", data.localSocketId);

    connectedPeers.forEach(function (element) {
      if (element !== data.localSocketId) {
        io.to(element).emit("AnswerSent", data);
        console.log("AnswerSent Event sent to Socket ID ->", element);
      }
    });
  });

  ///  AutoSdpOfferSent from web client

  socket.on("AutoSdpOfferSent", (data) => {
    console.log("Socket ID ->", data);

    connectedPeers.forEach(function (element) {
      if (element !== data) {
        io.to(element).emit("AutoSdpOfferRemote", data);
        console.log("AnswerSent Event sent to Socket ID ->", element);
      }
    });
  });

  //  OfferIceCandidate

  socket.on("ServerOfferIceCandidate", (data) => {
    console.log("Socket ID ->", data);

    connectedPeers.forEach(function (element) {
      if (element !== data.localSocketId) {
        io.to(element).emit("IceCandidate", data.IceCandidate);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected ");

    let indexToRemove = connectedPeers.indexOf(socket.id);
    if (indexToRemove !== -1) {
      connectedPeers.splice(indexToRemove, 1);
      conectedPeersNicNames.splice(indexToRemove, 1);
    }
    console.log("Disconect Conected Perres ->", connectedPeers);
    console.log("Disconect Conected Nick Names -> ", conectedPeersNicNames);

    // update all useres
    connectedPeers.forEach(function (element) {
      io.to(element).emit("calleList-update", connectedPeers);
      io.to(element).emit("calleList-nickNames-update", conectedPeersNicNames);
    });
  });

  // NickName updated by user Event hendler
  socket.on("user-nickname-update", (data) => {
    const { socketId, userNichName } = data;
    console.log("NickNameUpdate -> ", socketId, userNichName);

    const index = connectedPeers.indexOf(socketId);
    console.log("index ->", index);
    if (index !== -1) {
      conectedPeersNicNames[index] = userNichName;
    }
    console.log("conectedPeersSocketId  ->", connectedPeers);
    console.log("conectedPeersNicNames ->", conectedPeersNicNames);

    // update all useres with nichNames
    connectedPeers.forEach(function (element) {
      io.to(element).emit("calleList-nickNames-update", conectedPeersNicNames);
    });
  });

  socket.on("pre-offer", (data) => {
    console.log("pre-offer Event arive ");
    console.log(data);
    const { calleePersonalCode, callType } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === calleePersonalCode
    );

    console.log("ID exist -> ", connectedPeer);

    if (connectedPeer) {
      const data = {
        callerSocketId: socket.id,
        callType: callType,
      };

      console.log("target ID  -> ", data);
      console.log("calleePersonalCode ->", calleePersonalCode);
      io.to(calleePersonalCode).emit("pre-offer", data);
    } else {
      const data = {
        preOfferAnswer: "CALLEE_NOT_FOUND",
      };
      io.to(socket.id).emit("pre-offer-answer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {
    console.log("answer rexived - >", data);
    const { callerSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === callerSocketId
    );

    if (connectedPeer) {
      io.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });

  socket.on("webRTC-signaling", (data) => {
    const { connectedUserSocketId } = data;

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signaling", data);
    }
  });

  socket.on("user-hanged-up", (data) => {
    const { connectedUserSocketId } = data;
    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("user-hanged-up");
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
