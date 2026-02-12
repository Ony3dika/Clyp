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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, recording]);

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
      <div className='flex xl:flex-row flex-col h-[90vh] w-full'>
        {/* Main Content */}

        <div className='flex-1 flex items-center justify-center'>
          <Empty className='xl:w-2/3 border border-solid'>
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
              <div className='flex flex-col gap-4'>
                {recording ? (
                  <Button onClick={stopRecording}>
                    <VideoOff />
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={startRecording}>
                    <Video />
                    Start Recording
                  </Button>
                )}

                {/* <Button variant='outline'>View Recordings</Button> */}

                <div className='flex gap-2 border w-fit items-center justify-between px-3 py-2 rounded-md '>
                  <span className='text-sm text-gray-500'>Quality:</span>
                  <Select
                    value={quality}
                    onValueChange={setQuality}
                    disabled={recording}
                  >
                    <SelectTrigger className='w-[140px] border-none outline-none focus:outline-none'>
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
        </div>

        {/* Side Pane */}
        <div className='md:w-96 w-full border border-gray-200/20 backdrop-blur-[2px] bg-gray-50 p-4'>
          <h3 className='text-lg font-semibold mb-4'>Recording Preview</h3>

          {recording && stream ? (
            <div className='space-y-4'>
              <div className='rounded-lg border border-border overflow-hidden'>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className='w-full h-48 object-cover'
                />
              </div>
              <div className='text-sm text-gray-600'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
                  <span>Recording in progress...</span>
                </div>
                <p>Screen and microphone audio are being captured.</p>
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-center h-48 bg-gray-200 rounded-lg'>
              <div className='text-center text-gray-500'>
                <Camera className='mx-auto mb-2' size={32} />
                <p>No active recording</p>
                <p className='text-sm'>Start recording to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
