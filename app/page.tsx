"use client";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
export default function Home() {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [quality, setQuality] = useState("1080p");
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, recording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Start
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return toast.error("Screen recording is not supported on this device");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          frameRate: 120, // increase FPS
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true, // tab audio only
      });
      setStream(screenStream);

      const getConstraints = (quality: string) => {
        switch (quality) {
          case "720p":
            return { width: 1280, height: 720, bitrate: 5_000_000 };
          case "480p":
            return { width: 854, height: 480, bitrate: 2_000_000 };
          case "1080p":
          default:
            return { width: 1920, height: 1080, bitrate: 15_000_000 };
        }
      };

      const constraints = getConstraints(quality);

      const videoTrack = screenStream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        width: { ideal: constraints.width },
        height: { ideal: constraints.height },
        frameRate: 60,
      });

      const recorder = new MediaRecorder(screenStream, {
        mimeType: "video/mp4; codecs=vp9",
        videoBitsPerSecond: constraints.bitrate,
        audioBitsPerSecond: 256_000,
      });

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = saveRecording;

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);

      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please try again.");
    }
  };

  // Stop
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Save
  const saveRecording = () => {
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "recording.mp4";
    a.click();

    chunksRef.current = [];
  };

  return (
    <main className='relative p-0 m-0 flex flex-col bg-quad'>
      <Navbar />
      <div className='flex h-[90vh] w-full items-center justify-center'>
        {recording ? (
          <div className='flex flex-col items-center gap-6 xl:w-1/2 md:w-2/3 w-full px-4'>
            <div className='rounded-xl border border-border overflow-hidden w-full aspect-video bg-gray-900 shadow-lg relative'>
              <video
                ref={videoRef}
                autoPlay
                muted
                className='w-full h-full object-contain'
              />
            </div>
            <div className='flex items-center gap-2 mb-4'>
              <div className='text-2xl font-mono font-bold text-gray-800 dark:text-gray-200'>
                {formatDuration(duration)}
              </div>
              <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse' />
            </div>
            <Button
              onClick={stopRecording}
              size='lg'
              className='bg-red-500 hover:bg-red-600 text-white'
            >
              <VideoOff className='mr-2 h-5 w-5' />
              Stop Recording
            </Button>
          </div>
        ) : (
          <Empty className='xl:w-1/2 md:w-2/3 w-full border border-solid ml-auto mr-auto'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Camera />
              </EmptyMedia>
              <EmptyTitle className='font-semibold'>Clyp</EmptyTitle>
              <EmptyDescription>
                Record Videos on Screen and Store Locally
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className='flex flex-col gap-4 items-center'>
                <Button onClick={startRecording}>
                  <Video className='mr-2 h-4 w-4' />
                  Start Recording
                </Button>

                {/* <Button variant='outline'>View Recordings</Button> */}

                <div className='flex gap-2 border w-fit items-center justify-between px-2 rounded-md '>
                  <span className='text-sm text-gray-500'>Quality:</span>
                  <Select
                    value={quality}
                    onValueChange={setQuality}
                    disabled={recording}
                  >
                    <SelectTrigger className='w-[100px] p-0  border-none outline-none focus:outline-none'>
                      <SelectValue placeholder='Select Quality' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='1080p'>1080p (HD)</SelectItem>
                        <SelectItem value='720p'>720p</SelectItem>
                        <SelectItem value='480p'>480p</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </main>
  );
}
