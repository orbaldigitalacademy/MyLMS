import React, { useEffect } from "react";

const LiveClassRoom = ({ roomName, userName }) => {
  useEffect(() => {
    const domain = "meet.jit.si";

    const options = {
      roomName,
      width: "100%",
      height: 600,
      parentNode: document.querySelector("#jitsi-container"),
      userInfo: {
        displayName: userName,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => api.dispose();
  }, [roomName, userName]);

  return <div id="jitsi-container" />;
};

export default LiveClassRoom;