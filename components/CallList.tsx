"use client";

import { useGetCalls } from "@/hooks/useGetCalls";
import { Call, CallRecording } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";
import Loading from "./Loading";
import Alert from "@/components/Alert";
import { useRouter } from "next/navigation";
import MeetingCard from "./MeetingCard";

// Define CallList component with a prop 'type' that determines the type of calls to display
const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter(); // Initialize router for navigation
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls(); // Destructure values from custom hook
  const [recordings, setRecordings] = useState<CallRecording[]>([]); // State to store recordings

  // Function to determine which calls to return based on 'type' prop
  const getCalls = () => {
    switch (type) {
      case "ended":
        return endedCalls; // Return ended calls
      case "recordings":
        return recordings; // Return recordings
      case "upcoming":
        return upcomingCalls; // Return upcoming calls
      default:
        return []; // Return empty array if type is unknown
    }
  };

  // Effect to fetch recordings when type is 'recordings'
  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [] // Fetch recordings for each call
      );

      // Flatten and filter out empty recordings
      const recordings = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(recordings); // Update recordings state
    };

    if (type === "recordings") {
      fetchRecordings(); // Fetch recordings only when type is 'recordings'
    }
  }, [type, callRecordings]); // Re-run effect when type or callRecordings changes

  if (isLoading) return <Loading />; // Show loading component if data is still loading

  const calls = getCalls(); // Get relevant calls based on type

  // Render MeetingCards if calls exist
  if (calls && calls.length > 0)
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {" "}
        {/* Grid layout for calls */}
        {calls.map((meeting: Call | CallRecording) => {
          // Map over calls
          return (
            <MeetingCard
              call={meeting as Call} // Cast meeting as Call
              key={
                type === "recordings"
                  ? (meeting as CallRecording).url // Use recording URL as key for recordings
                  : (meeting as Call).id // Use call ID as key for other types
              }
              type={type} // Pass type prop
              icon={
                type === "ended"
                  ? "/assets/previous.svg" // Icon for ended calls
                  : type === "recordings"
                  ? "/assets/recordings2.svg" // Icon for recordings
                  : "/assets/upcoming.svg" // Icon for upcoming calls
              }
              title={
                (meeting as Call).state?.custom?.description || // Use custom description if available
                (meeting as CallRecording).filename?.substring(0, 20) || // Use recording filename if available
                "No Description" // Default title
              }
              date={
                (meeting as Call).state?.startsAt?.toLocaleString() || // Use start time if available
                (meeting as CallRecording).start_time?.toLocaleString() // Use recording start time if available
              }
              isPreviousMeeting={type === "ended"} // Indicate if meeting is previous
              link={
                type === "recordings"
                  ? (meeting as CallRecording).url // Use recording URL if type is recordings
                  : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${
                      (meeting as Call).id
                    }` // Construct meeting URL
              }
              buttonIcon1={
                type === "recordings" ? "/assets/play.svg" : undefined
              } // Use play icon for recordings
              buttonText={type === "recordings" ? "Play" : "Start"} // Use 'Play' for recordings, 'Start' otherwise
              handleClick={
                type === "recordings"
                  ? () => router.push(`${(meeting as CallRecording).url}`) // Navigate to recording URL
                  : () => router.push(`/meeting/${(meeting as Call).id}`) // Navigate to meeting page
              }
            />
          );
        })}
      </div>
    );

  // If no calls exist, display an alert message
  return (
    <Alert
      title="No calls available" // Alert title
      iconUrl="/assets/no-calls.svg" // Alert icon
    />
  );
};

export default CallList;
