"use client";

import {
  ComponentProps,
  createContext,
  HTMLProps,
  ReactNode,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { PauseIcon, PlayIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

enum ReadyState {
  HAVE_NOTHING = 0,
  HAVE_METADATA = 1,
  HAVE_CURRENT_DATA = 2,
  HAVE_FUTURE_DATA = 3,
  HAVE_ENOUGH_DATA = 4,
}

enum NetworkState {
  NETWORK_EMPTY = 0,
  NETWORK_IDLE = 1,
  NETWORK_LOADING = 2,
  NETWORK_NO_SOURCE = 3,
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins < 10 ? `0${mins}` : mins;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  return hrs > 0
    ? `${hrs}:${formattedMins}:${formattedSecs}`
    : `${mins}:${formattedSecs}`;
}

interface AudioPlayerApi {
  ref: RefObject<HTMLAudioElement | null>;
  src: string | null;
  duration: number | undefined;
  error: MediaError | null;
  isPlaying: boolean;
  isBuffering: boolean;
  setSrc: (src: string | null) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerApi | null>(null);

export function useAudioPlayer(): AudioPlayerApi {
  const api = useContext(AudioPlayerContext);
  if (!api) {
    throw new Error(
      "useAudioPlayer cannot be called outside of AudioPlayerProvider"
    );
  }
  return api;
}

const AudioPlayerTimeContext = createContext<number | null>(null);

export const useAudioPlayerTime = () => {
  const time = useContext(AudioPlayerTimeContext);
  if (time === null) {
    throw new Error(
      "useAudioPlayerTime cannot be called outside of AudioPlayerProvider"
    );
  }
  return time;
};

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [readyState, setReadyState] = useState<number>(0);
  const [networkState, setNetworkState] = useState<number>(0);
  const [time, setTime] = useState<number>(0);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [error, setError] = useState<MediaError | null>(null);
  const [src, setSrcState] = useState<string | null>(null);
  const [paused, setPaused] = useState(true);

  const setSrc = useCallback(
    (newSrc: string | null) => {
      if (!audioRef.current) return;

      if (newSrc === src) return;

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (newSrc === null) {
        audioRef.current.removeAttribute("src");
      } else {
        audioRef.current.src = newSrc;
      }
      audioRef.current.load();
      setSrcState(newSrc);
    },
    [src]
  );

  const play = useCallback(async () => {
    if (!audioRef.current) return;

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error) {
        console.error("Play promise error:", error);
      }
    }

    const playPromise = audioRef.current.play();
    playPromiseRef.current = playPromise;
    return playPromise;
  }, []);

  const pause = useCallback(async () => {
    if (!audioRef.current) return;

    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (e) {
        console.error(e);
      }
    }

    audioRef.current.pause();
    playPromiseRef.current = null;
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  }, []);

  useAnimationFrame(() => {
    if (audioRef.current) {
      setReadyState(audioRef.current.readyState);
      setNetworkState(audioRef.current.networkState);
      setTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      setPaused(audioRef.current.paused);
      setError(audioRef.current.error);
    }
  });

  const isPlaying = !paused;
  const isBuffering =
    readyState < ReadyState.HAVE_FUTURE_DATA &&
    networkState === NetworkState.NETWORK_LOADING;

  const api = useMemo<AudioPlayerApi>(
    () => ({
      ref: audioRef,
      src,
      duration,
      error,
      isPlaying,
      isBuffering,
      setSrc,
      play,
      pause,
      seek,
    }),
    [
      audioRef,
      src,
      duration,
      error,
      isPlaying,
      isBuffering,
      setSrc,
      play,
      pause,
      seek,
    ]
  );

  return (
    <AudioPlayerContext.Provider value={api}>
      <AudioPlayerTimeContext.Provider value={time}>
        <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />
        {children}
      </AudioPlayerTimeContext.Provider>
    </AudioPlayerContext.Provider>
  );
}

export const AudioPlayerProgress = memo(
  ({
    ...otherProps
  }: Omit<
    ComponentProps<typeof SliderPrimitive.Root>,
    "min" | "max" | "value"
  >) => {
    const player = useAudioPlayer();
    const time = useAudioPlayerTime();
    const wasPlayingRef = useRef(false);

    // Extract handlers to avoid including entire otherProps object in deps
    const { onValueChange, onPointerDown, onPointerUp, onKeyDown } = otherProps;

    // Memoized handlers to prevent function recreation
    const handleValueChange = useCallback(
      (vals: number[]) => {
        player.seek(vals[0]);
        onValueChange?.(vals);
      },
      [player, onValueChange]
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        wasPlayingRef.current = player.isPlaying;
        player.pause();
        onPointerDown?.(e as React.PointerEvent<HTMLDivElement>);
      },
      [player, onPointerDown]
    );

    const handlePointerUp = useCallback(
      (e: React.PointerEvent) => {
        if (wasPlayingRef.current) {
          player.play();
        }
        onPointerUp?.(e as React.PointerEvent<HTMLDivElement>);
      },
      [player, onPointerUp]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === " ") {
          e.preventDefault();
          if (!player.isPlaying) {
            player.play();
          } else {
            player.pause();
          }
        }
        onKeyDown?.(e as React.KeyboardEvent<HTMLDivElement>);
      },
      [player, onKeyDown]
    );

    // Memoized disabled state
    const isDisabled = useMemo(
      () =>
        player.duration === undefined ||
        !Number.isFinite(player.duration) ||
        Number.isNaN(player.duration),
      [player.duration]
    );

    // Memoized step value
    const stepValue = useMemo(() => otherProps.step || 0.25, [otherProps.step]);

    return (
      <SliderPrimitive.Root
        {...otherProps}
        value={[time]}
        onValueChange={handleValueChange}
        min={0}
        max={player.duration ?? 0}
        step={stepValue}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(
          "group/player relative flex h-4 touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
          otherProps.className
        )}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
      >
        <SliderPrimitive.Track className="bg-muted relative h-[4px] w-full grow overflow-hidden rounded-full">
          <SliderPrimitive.Range className="bg-primary absolute h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="relative flex h-0 w-0 items-center justify-center opacity-0 group-hover/player:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          data-slot="slider-thumb"
        >
          <div className="bg-foreground absolute size-3 rounded-full" />
        </SliderPrimitive.Thumb>
      </SliderPrimitive.Root>
    );
  }
);
AudioPlayerProgress.displayName = "AudioPlayerProgress";

export const AudioPlayerTime = memo(
  ({ className, ...otherProps }: HTMLProps<HTMLSpanElement>) => {
    const time = useAudioPlayerTime();

    // Memoized formatted time to prevent recalculation
    const formattedTime = useMemo(() => formatTime(time), [time]);

    return (
      <span
        {...otherProps}
        className={cn("text-muted-foreground text-sm tabular-nums", className)}
      >
        {formattedTime}
      </span>
    );
  }
);
AudioPlayerTime.displayName = "AudioPlayerTime";

export const AudioPlayerDuration = memo(
  ({ className, ...otherProps }: HTMLProps<HTMLSpanElement>) => {
    const player = useAudioPlayer();

    // Memoized formatted duration to prevent recalculation
    const formattedDuration = useMemo(() => {
      if (
        player.duration !== null &&
        player.duration !== undefined &&
        !Number.isNaN(player.duration)
      ) {
        return formatTime(player.duration);
      }
      return "--:--";
    }, [player.duration]);

    return (
      <span
        {...otherProps}
        className={cn("text-muted-foreground text-sm tabular-nums", className)}
      >
        {formattedDuration}
      </span>
    );
  }
);
AudioPlayerDuration.displayName = "AudioPlayerDuration";

interface SpinnerProps {
  className?: string;
}

const Spinner = memo(({ className }: SpinnerProps) => {
  return (
    <div
      className={cn(
        "border-muted border-t-foreground size-3.5 animate-spin rounded-full border-2",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});
Spinner.displayName = "Spinner";

interface PlayButtonProps extends React.ComponentProps<typeof Button> {
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
  loading?: boolean;
}

const PlayButton = memo(
  ({
    playing,
    onPlayingChange,
    className,
    onClick,
    loading,
    ...otherProps
  }: PlayButtonProps) => {
    // Memoized click handler to prevent function recreation
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onPlayingChange(!playing);
        onClick?.(e);
      },
      [onPlayingChange, playing, onClick]
    );

    // Memoized aria label to prevent string recreation
    const ariaLabel = useMemo(() => (playing ? "Pause" : "Play"), [playing]);

    // Memoized animation variants for better performance
    const animationVariants = useMemo(
      () => ({
        initial: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
      }),
      []
    );

    return (
      <Button
        {...otherProps}
        onClick={handleClick}
        className={cn("relative", className)}
        aria-label={ariaLabel}
        type="button"
      >
        <div className="relative w-[12px] h-[12px] flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {playing ? (
              <motion.div
                key="pause"
                initial={animationVariants.initial}
                animate={animationVariants.animate}
                exit={animationVariants.exit}
                transition={{ duration: 0.15 }}
                className={cn(loading && "opacity-0")}
                style={{ willChange: "transform" }}
              >
                <PauseIcon className="size-3" aria-hidden="true" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={animationVariants.initial}
                animate={animationVariants.animate}
                exit={animationVariants.exit}
                transition={{ duration: 0.15 }}
                className={cn(loading && "opacity-0")}
                style={{ willChange: "transform" }}
              >
                <PlayIcon className="size-3" aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] backdrop-blur-xs">
            <Spinner />
          </div>
        )}
      </Button>
    );
  }
);
PlayButton.displayName = "PlayButton";

export interface AudioPlayerButtonProps
  extends React.ComponentProps<typeof Button> {
  src?: string;
}

export const AudioPlayerButton = memo(
  ({ src, ...otherProps }: AudioPlayerButtonProps) => {
    const player = useAudioPlayer();

    // Set the audio source when provided
    useEffect(() => {
      if (src) {
        player.setSrc(src);
      }
    }, [src, player]);

    // Memoized play/pause handler to prevent function recreation
    const handlePlayingChange = useCallback(
      (shouldPlay: boolean) => {
        if (shouldPlay) {
          player.play();
        } else {
          player.pause();
        }
      },
      [player]
    );

    return (
      <PlayButton
        {...otherProps}
        playing={player.isPlaying}
        onPlayingChange={handlePlayingChange}
        loading={player.isBuffering && player.isPlaying}
      />
    );
  }
);
AudioPlayerButton.displayName = "AudioPlayerButton";

type Callback = (delta: number) => void;

function useAnimationFrame(callback: Callback) {
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const callbackRef = useRef<Callback>(callback);

  // Use useCallback to memoize the callback update
  const updateCallback = useCallback((newCallback: Callback) => {
    callbackRef.current = newCallback;
  }, []);

  useEffect(() => {
    updateCallback(callback);
  }, [callback, updateCallback]);

  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const delta = time - previousTimeRef.current;
        callbackRef.current(delta);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    };
  }, []);
}
