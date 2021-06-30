import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faMicrophone,
  faPhone,
  faMicrophoneSlash,
  faVideoSlash,
  faUserPlus,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import "./Room.css";

const Container = styled.div`
  display: flex;
  height: 90vh;
  width: 100vw;
  flex-wrap: wrap;
  background-color: #202124;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <video ref={ref} autoPlay playsInline className={props.classn} />;
};

const Message = (props) => {
  return (
    <div className="amsg">
      <div style={{ fontSize: 14, fontWeight: "bold" }}>{props.by}</div>
      <div style={{ fontSize: 14 }}>{props.content}</div>
    </div>
  );
};

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Room = (props) => {
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(true);
  const msgEndRef = useRef();
  const [txt, settxt] = useState("");
  const [msgs, setmsgs] = useState([]);

  useEffect(() => {
    socketRef.current = io.connect("/");
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", roomID);
        socketRef.current.on("all users", (users) => {
          const peers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current.id, stream);
            peersRef.current.push({
              peerID: userID,
              peer,
            });
            peers.push({ peer, peerID: userID });
          });
          setPeers(peers);
        });

        socketRef.current.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });

          setPeers((users) => [
            ...users,
            {
              peerID: payload.callerID,
              peer,
            },
          ]);
        });

        socketRef.current.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });

        socketRef.current.on("new message", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) {
            setmsgs((msgs) => [
              ...msgs,
              {
                by: payload.by,
                content: payload.content,
              },
            ]);
          }
        });

        socketRef.current.on("user-left", (id) => {
          const item = peersRef.current.find((p) => p.peerID === id);
          if (item) {
            item.peer.destroy();
          }
          const newpeers = peersRef.current.filter((p) => p.peerID !== id);
          peersRef.current = newpeers;
          setPeers(newpeers);
        });
      });
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const length = peers.length;
  let classn = "";
  if (length === 0) {
    classn = "one";
  } else {
    classn = "two";
  }

  const toggleCam = () => {
    const enabled = userVideo.current.srcObject.getVideoTracks()[0].enabled;

    if (enabled) {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = false;
    } else {
      userVideo.current.srcObject.getVideoTracks()[0].enabled = true;
    }

    setCam((cam) => !cam);
  };
  const toggleMic = () => {
    const enabled = userVideo.current.srcObject.getAudioTracks()[0].enabled;

    if (enabled) {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = false;
    } else {
      userVideo.current.srcObject.getAudioTracks()[0].enabled = true;
    }

    setMic((mic) => !mic);
  };

  let vid = (
    <div className="icon" onClick={toggleCam}>
      <FontAwesomeIcon icon={faVideo} size="1x" color="white" />
    </div>
  );

  if (!cam) {
    vid = (
      <div
        className="icon"
        style={{ backgroundColor: "red" }}
        onClick={toggleCam}
      >
        <FontAwesomeIcon icon={faVideoSlash} size="1x" color="white" />
      </div>
    );
  }
  let m = (
    <div className="icon" onClick={toggleMic}>
      <FontAwesomeIcon icon={faMicrophone} size="1x" color="white" />
    </div>
  );

  const scrollToBottom = () => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  if (!mic) {
    m = (
      <div
        className="icon"
        style={{ backgroundColor: "red" }}
        onClick={toggleMic}
      >
        <FontAwesomeIcon icon={faMicrophoneSlash} size="1x" color="white" />
      </div>
    );
  }

  const addUser = () => {
    prompt(
      "Copy this link and send it to people you want to meet with",
      window.location.href
    );
  };

  const leave = () => {
    userVideo.current.srcObject.getVideoTracks()[0].stop();
    userVideo.current.srcObject.getAudioTracks()[0].stop();
    window.location.href = "/";
  };

  const handlechange = (e) => {
    settxt(e.target.value);
  };

  const sendMsg = () => {
    if (txt.trim() !== "") {
      setmsgs((msgs) => [
        ...msgs,
        {
          by: "You",
          content: txt,
        },
      ]);

      socketRef.current.emit("sending message", {
        by: "User",
        content: txt,
      });

      settxt("");
    }
  };
  const sendMsg1 = (e) => {
    if (txt.trim() !== "" && e.key === 'Enter') {
      setmsgs((msgs) => [
        ...msgs,
        {
          by: "You",
          content: txt,
        },
      ]);

      socketRef.current.emit("sending message", {
        by: "User",
        content: txt,
      });

      settxt("");
    }
  };

  return (
    <div>
      <Container>
        <div className="videos">
          <video
            ref={userVideo}
            autoPlay
            playsInline
            muted
            className={classn}
          />
          {peers.map((peer) => {
            return <Video key={peer.peerID} peer={peer.peer} classn={classn} />;
          })}
        </div>
        <div className="chatbox">
          <div class="chatbtitle">In-Call Messages</div>
          <div className="chatbinfo">
            Messages can only be seen by people in the call and are deleted when
            the call ends.
          </div>
          <div className="allmessages" onScroll={() => {}}>
            {msgs.map((msg) => {
              return (
                <Message
                  key={Math.random()}
                  by={msg.by}
                  content={msg.content}
                />
              );
            })}
            <div ref={msgEndRef} />
          </div>
          <div className="chatbsend" onKeyDown={sendMsg1}>
            <textarea
              placeholder="Send a Message to everyone"
              value={txt}
              onChange={handlechange}
            ></textarea>
            <div style={{ cursor: "pointer" }} onClick={sendMsg}>
              <FontAwesomeIcon icon={faPaperPlane} size="1x" color="black" />
            </div>
          </div>
        </div>
      </Container>
      <div className="controls">
        {vid}
        {m}
        <div
          className="icon"
          style={{ backgroundColor: "red" }}
          onClick={leave}
        >
          <FontAwesomeIcon icon={faPhone} size="1x" color="white" />
        </div>
        <div className="icon" onClick={addUser}>
          <FontAwesomeIcon icon={faUserPlus} size="1x" color="white" />
        </div>
      </div>
    </div>
  );
};

export default Room;
