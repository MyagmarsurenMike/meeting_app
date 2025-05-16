'use client'

import { useAuth } from "@/context/AuthContext";
import { DeviceSettings, useCall, useCallStateHooks, VideoPreview } from "@stream-io/video-react-sdk";
import Alert from "@/components/Alert";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const MeetingSetup = ({
    setIsSetupComplete,
  }: {
    setIsSetupComplete: (value: boolean) => void;
  }) => {

    const {user} = useAuth()
    if(!user) return

    const call = useCall();
    if (!call) {
        throw new Error(
          'useStreamCall must be used within a StreamCall component.',
        );
      }

        const { useCallEndedAt, useCallStartsAt } = useCallStateHooks();
        const callStartsAt = useCallStartsAt();
        const callEndedAt = useCallEndedAt();
        const callTimeNotArrived =
            callStartsAt && new Date(callStartsAt) > new Date();
        const callHasEnded = !!callEndedAt;
        const [isMicCamToggled, setIsMicCamToggled] = useState(false);

        useEffect(() => {
            if (isMicCamToggled) {
              call.camera.disable();
              call.microphone.disable();
            } else {
              call.camera.enable();
              call.microphone.enable();
            }
          }, [isMicCamToggled, call.camera, call.microphone]);


        if (callTimeNotArrived)
            return (
              <Alert
                title={`Your Meeting has not started yet. It is scheduled for ${callStartsAt.toLocaleString()}`}
              />
            );
        
          if (callHasEnded) 
            return (
              <Alert
                title="The call has been ended by the host"
                iconUrl="/assets/call-ended.svg"
              />
            );

        return(
            <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-black">
            <h1 className="text-center text-2xl font-bold">Meeting Setup</h1>
              <VideoPreview />
            <div className="flex h-16 items-center justify-center gap-3">
              <label className="flex items-center justify-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={isMicCamToggled}
                  onChange={(e) => setIsMicCamToggled(e.target.checked)}
                />
                Join with mic and camera off
              </label>
              <DeviceSettings />
              
            </div>
            <Button
              className="rounded-3xl bg-blue-500 p-6 hover:bg-blue-800 hover:scale-125 transition ease-in-out delay-150 duration-300"
              onClick={() => {
                call.join();
                call.updateCallMembers({
                  update_members: [{ user_id: user.id }],
                })
      
                setIsSetupComplete(true);
              }}
            >
              Join meeting
            </Button>
          </div>
        )
    

  }

  export default MeetingSetup