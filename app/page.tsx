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
import Navbar from "@/components/navbar";
export default function Home() {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, recording]);

  useEffect(() => {
    if (webcamRef.current && webcamStream) {
      webcamRef.current.srcObject = webcamStream;
    }
  }, [webcamStream, recording]);

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

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setWebcamStream(micStream);

      const videoTrack = screenStream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: 60,
      });

      const combinedStream = new MediaStream();
      combinedStream.addTrack(videoTrack);

      // Audio Mixing
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const destination = audioContext.createMediaStreamDestination();

      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(screenStream);
        screenSource.connect(destination);
      }

      if (micStream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      destination.stream
        .getAudioTracks()
        .forEach((t) => combinedStream.addTrack(t));

      setStream(combinedStream);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/mp4; codecs=vp9",
        videoBitsPerSecond: 15_000_000, // 15 Mbps
        audioBitsPerSecond: 256_000, // better audio quality
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

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
              <div className='flex gap-2'>
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

          <h3 className='text-lg font-semibold mb-4 mt-8'>Webcam Preview</h3>
          {recording && webcamStream ? (
            <div className='rounded-lg border border-border overflow-hidden'>
              <video
                ref={webcamRef}
                autoPlay
                muted
                className='w-full h-48 object-cover'
              />
            </div>
          ) : (
            <div className='flex items-center justify-center h-48 bg-gray-200 rounded-lg'>
              <div className='text-center text-gray-500'>
                <Camera className='mx-auto mb-2' size={32} />
                <p>No active webcam</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
