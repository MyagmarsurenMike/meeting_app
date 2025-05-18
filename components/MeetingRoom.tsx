'use client'

import { useAuth } from "@/context/AuthContext";
import { CallControls, CallingState, CallParticipantsList, CallStatsButton, PaginatedGridLayout, SpeakerLayout, useCallStateHooks } from "@stream-io/video-react-sdk";
import { useState } from "react";
import Loading from "./Loading";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LayoutList, Users } from "lucide-react";
import EndCallButton from "./EndCallButton";

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
    const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
    const [showParticipants, setShowParticipants] = useState(false);
    const router = useRouter();
    const pathname = usePathname()  
    const { user } = useAuth();
    if(!user) return
    const { useCallCallingState } = useCallStateHooks()
    const callingState = useCallCallingState()
    if (callingState !== CallingState.JOINED) return <Loading />;

    const CallLayout = () => {
        switch (layout) {
          case 'grid':
            return <PaginatedGridLayout />;
          case 'speaker-right':
            return <SpeakerLayout participantsBarPosition="left" />;
          default:
            return <SpeakerLayout participantsBarPosition="right" />;
        }
      };

      return (
        <section className="relative h-screen w-full overflow-hidden pt-4 text-white ">
          {/* Invite Button */}
          <div className="flex justify-between items-center mb-4 px-4">
            <Button
              className="font-semibold  hover:scale-105 rounded-3xl px-5 py-2 text-sm md:text-base transition-all"
              onClick={() => {
                const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}${pathname}`;
                navigator.clipboard.writeText(meetingLink);
                toast('Meeting Link Copied', {
                  duration: 3000,
                  className: ' !rounded-3xl !py-8 !px-5 !justify-center',
                });
              }}
            >
              Invite 
            </Button>
          </div>
      
          {/* Main Content */}
          <div className="flex flex-col md:flex-row h-full w-full">
            <div className="relative flex flex-col md:flex-row size-full items-start justify-center mx-auto">
              {/* Video Area */}
              <div
                className={cn(
                  "flex h-full w-full max-w-full animate-fade-in transition-all duration-300 rounded-2xl  ",
                  showParticipants ? "md:max-w-[calc(1000px)]" : "md:max-w-[1000px]"
                )}
              >
                <CallLayout />
              </div>
            </div>
            {/* Participants Sidebar (desktop: side, mobile: overlay) */}
            {showParticipants && (
              <div
                className={cn(
                  "p-4 w-full max-w-xs overflow-y-auto transition-all duration-300 ",
                  "md:static md:rounded-l-2xl md:relative md:block absolute right-0 top-0 rounded-l-2xl",
                  "md:max-w-xs md:z-10"
                )}
                style={{
                  marginTop: '1rem',
                  height: 'calc(80% - 4rem)'
                }}
              >
                <CallParticipantsList onClose={() => setShowParticipants(false)} />
              </div>
            )}
          </div>
          {/* Call Controls */}
          <div className="fixed bottom-0 left-0 w-full flex flex-wrap items-center justify-center gap-2 md:gap-5 py-2 md:py-4 z- backdrop-blur-md ">
            <CallControls onLeave={() => router.push(`/`)} />
      
            <DropdownMenu>
              <div className="flex items-center">
                <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]">
                  <LayoutList size={20} className="text-white" />
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent className="border-black bg-[#232a3b] text-white ">
                {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
                  <div key={index}>
                    <DropdownMenuItem
                      onClick={() =>
                        setLayout(item.toLowerCase() as CallLayoutType)
                      }
                    >
                      {item}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="border-[#2e3650]" />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <CallStatsButton />
            <button
              onClick={() => setShowParticipants((prev) => !prev)}
              className="focus:outline-none"
              aria-label="Show participants"
            >
              <div className="cursor-pointer rounded-2xl bg-[#19232d] px-3 py-2 hover:bg-[#4c535b]">
                <Users size={20} className="text-white" />
              </div>
            </button>
            <EndCallButton />
          </div>
        </section>
      )
}

export default MeetingRoom

