"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import MenuItemCard from "./MenuItemCard";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import DatePicker from "react-datepicker";
import Loading from "./Loading";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

const initialValues = {
  dateTime: new Date(),
  description: "",
  link: "",
};

const MainMenu = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [meetingState, setMeetingState] = useState<
    "Schedule" | "Instant" | undefined
  >(undefined);
  const client = useStreamVideoClient();

  const createMeeting = async () => {
    if (!user) return router.push("/login");
    if (!client) return router.push("/");

    try {
      if (!values.dateTime) {
        toast("Please select a date and time", {
          duration: 3000,
          className: "bg-gray-300 rounded-3xl py-8 px-5 justify-center",
        });
        return;
      }

      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
      const call = client.call("default", id);
      if (!call) throw new Error("Failed to create meeting");
      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || "No Description";
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
          },
        },
      });

      await call.updateCallMembers({
        update_members: [{ user_id: user.id }],
      });

      if (meetingState === "Instant") {
        router.push(`/meeting/${call.id}`);
        toast("Setting up your meeting", {
          duration: 3000,
          className: "!bg-gray-300 !rounded-3xl !py-8 !px-5 !justify-center",
        });
      }
    } catch (err: any) {
      toast(`Failed to create Meeting ${err.message}`, {
        duration: 3000,
        className: "!bg-gray-300 !rounded-3xl !py-8 !px-5 !justify-center",
      });
    }
  };

  useEffect(() => {
    if (meetingState) {
      createMeeting();
    }
  }, [meetingState]);

  if (!client || !user) return <Loading />;

  return (
    <section className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <Dialog>
        <DialogTrigger className="w-full">
          <MenuItemCard
            img="/assets/new-meeting.svg"
            title="New Meeting"
            bgColor="bg-orange-500"
            hoverColor="hover:bg-orange-800"
          />
        </DialogTrigger>
        <DialogContent className=" bg-gray-200 px-16 py-10 text-gray-900 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black leading-relaxed text-center ">
              Start an Instant Meeting 🤝
            </DialogTitle>
            <DialogDescription className="flex flex-col items-center ">
              Add a meeting description
              <Textarea
                className="inputs p-5"
                rows={4}
                onChange={(e) =>
                  setValues({ ...values, description: e.target.value })
                }
              />
              <Button
                className="mt-5 font-extrabold text-lg text-white rounded-xl bg-blue-700 py-5 px-10 hover:bg-blue-900 hover:scale-110 transition ease-in-out delay-75 duration-700 hover:-translate-y-1 cursor-pointer"
                onClick={() => setMeetingState("Instant")}
              >
                Create Meeting
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger className="w-full">
          <MenuItemCard
            img="/assets/join-meeting.svg"
            title="Join Meeting"
            bgColor="bg-blue-600"
            hoverColor="hover:bg-blue-800"
          />
        </DialogTrigger>
        <DialogContent className=" bg-gray-200 px-16 py-10 text-gray-900 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black leading-relaxed text-center mb-5 ">
              Type the Meeting link here
            </DialogTitle>
            <DialogDescription className="flex flex-col gap-3 items-center">
              <Input
                type="text"
                placeholder="Meeting Link"
                onChange={(e) => setValues({ ...values, link: e.target.value })}
                className="inputs"
              />

              <Button
                className="mt-5 font-extrabold text-lg text-white rounded-xl bg-blue-700 py-5 px-10 hover:bg-blue-900 hover:scale-110 transition ease-in-out delay-75 duration-700 hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(values.link)}
              >
                Join Meeting
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default MainMenu;
