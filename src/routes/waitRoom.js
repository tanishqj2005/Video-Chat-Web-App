import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faMicrophone,
  faMicrophoneSlash,
  faVideoSlash,
} from "@fortawesome/free-solid-svg-icons";
import "./waitRoom.css";

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Room = (props) => {
  const userVideo = useRef();
  const roomID = props.match.params.roomID;
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(true);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
      });
  }, []);

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
    <div className="ic" onClick={toggleCam}>
      <FontAwesomeIcon icon={faVideo} size="2x" color="white" />
    </div>
  );

  if (!cam) {
    vid = (
      <div
        className="ic"
        style={{ backgroundColor: "red" }}
        onClick={toggleCam}
      >
        <FontAwesomeIcon icon={faVideoSlash} size="2x" color="white" />
      </div>
    );
  }
  let m = (
    <div className="ic" onClick={toggleMic}>
      <FontAwesomeIcon icon={faMicrophone} size="2x" color="white" />
    </div>
  );

  if (!mic) {
    m = (
      <div
        className="ic"
        style={{ backgroundColor: "red" }}
        onClick={toggleMic}
      >
        <FontAwesomeIcon icon={faMicrophoneSlash} size="2x" color="white" />
      </div>
    );
  }

  const join = () => {
    props.history.push(`/room/${roomID}`, {
      cam,
      mic,
    });
  };
  const toHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="container">
      <div className="videocontbox">
        <div className="taskbar">
          <div className="logo">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2zfAREgkmbvcbWq8CfWYnRK1TIQ2PD3QKcg&usqp=CAU" />
          </div>
          <p className="title" onClick={toHome}>
            Ezy <span>Chat</span>
          </p>
        </div>
        <div className="videobox">
          <video ref={userVideo} autoPlay playsInline muted className="one" />
        </div>
        <div className="contr">
          {vid}
          {m}
        </div>
      </div>
      <div className="joinbox">
        <p>Ready to Join?</p>
        <div className="btnBox">
          <div className="joinbtn" onClick={join}>
            Join Now
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
