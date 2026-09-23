"use client";

import * as React from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";

export interface RecordingPlayerProps {
  src: string;
  className?: string;
}

export function RecordingPlayer({ src, className }: RecordingPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => setError(true));
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const next = (Number(event.target.value) / 100) * duration;
    audio.currentTime = next;
    setCurrentTime(next);
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-full border border-border/60 bg-card/80 py-2 pl-2 pr-4 shadow-sm sm:w-72",
        className,
      )}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="use-credentials"
        src={src}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          setLoaded(true);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />

      <button
        type="button"
        onClick={togglePlay}
        disabled={error}
        aria-label={playing ? "Pause recording" : "Play recording"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {playing ? (
          <Pause className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Play className="ml-0.5 h-3.5 w-3.5" aria-hidden />
        )}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {error ? (
          <span className="text-xs text-destructive">Couldn&apos;t load recording</span>
        ) : (
          <>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={seek}
              disabled={!loaded}
              aria-label="Seek recording"
              className="audio-seek h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border/60 accent-primary disabled:cursor-default"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--border)) ${progress}%)`,
              }}
            />
            <span className="w-9 shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={toggleMute}
        disabled={error}
        aria-label={muted ? "Unmute" : "Mute"}
        className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        {muted ? (
          <VolumeX className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <Volume2 className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
