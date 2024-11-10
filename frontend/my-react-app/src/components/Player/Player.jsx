/*
Artifact(s): Play Button, Stop Button, Next Button, Prev Button, Progress Bar, Volume Button, Artist Name, Song Title, Album Art
Description: React component that's built up of multiple components to provide the complete music player that can run independently. 
Name: Anil Thapa
Date: 10/26/2024
Revised: 10/27/2024 (Integrating with Backend -- Anil)
Revised: 11/09/2024 (Integrating with the new context and QueueManager)
Preconditions: Information about the queue from QueueContext
Postconditions: Provides an interface for music
Error and exception conditions: Mistakes in the backend
Side effects: N/A
*/

import './Player.css'
import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import VolumeControl from './VolumeControl'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useQueue } from '../../context/QueueContext';

import defaultImage from '../../assets/default.png'

/*
When creating the main Player component, we define the necessary variables to run the player.
These variables will be passed into child components so they can change the state of the main component through their actions.
E.g. clicking the play button in PlayerControls will use setIsPlaying to change the state of isPlaying.
isPlaying -- running the music
songData -- used for initializing song name, artist name, file path, and time of song
duration -- passed in through by songData and altered for progressBar
volume -- used by the VolumeControl to change audio volume
songHistory and currentSongIndex are just used to keep track of what song is next/previous
*/

function Player() {
  const {
    queue,
    setCurrentQueuePosition,
    fetchQueue,
    getNextInQueue,
    hasNext,
    getFormattedSongData,
    prepareSongForPlayback
  } = useQueue();

  /*
  State management for data
  */
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songHistory, setSongHistory] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const audioRef = useRef(new Audio());

  /*
  Fetch a random song from the backend when there are no more songs in the queue
  API call to random_song --> Format song --> Update song history and current index --> Prepare for audio callback
  */
  const fetchSong = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/random_song");
      const rawData = await response.json();

      const songData = await getFormattedSongData(rawData.title);

      if (songData) {
        setSongData(songData.formattedData);
        setSongHistory(prev => [...prev.slice(0, currentSongIndex + 1), songData.formattedData]);
        setCurrentSongIndex(prev => prev + 1);
        audioRef.current.src = songData.formattedData.audioUrl;

        await songData.prepareForPlayback();

        if (isPlaying) {
          await audioRef.current.play();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentSongIndex, getFormattedSongData, isPlaying]);

  /*
  Handle transitions to the next song from either the queue or a random song (if index is at the end of queue)
  Race condition check with isTransitioning and then manages loading state
  Clean current audio --> get next song in queue or random --> format and load song --> update queue position --> handle playback
  */
  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    try {
      const wasPlaying = isPlaying;
      setIsLoading(true);
      setIsPlaying(false);

      if (audioRef.current) {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        await new Promise(resolve => setTimeout(resolve, 100)); 
      }

      if (hasNext()) {
        const nextQueueSong = getNextInQueue();
        if (!nextQueueSong) return;

        const songData = await getFormattedSongData(nextQueueSong.title);
        if (!songData) {
          console.error("Could not get song data for:", nextQueueSong.title);
          return;
        }

        setSongData(songData.formattedData);
        setSongHistory(prev => [...prev.slice(0, currentSongIndex + 1), songData.formattedData]);
        setCurrentSongIndex(prev => prev + 1);
        setCurrentQueuePosition(nextQueueSong.position);

        const audio = audioRef.current;
        audio.src = songData.formattedData.audioUrl;

        await new Promise((resolve, reject) => {
          const loadHandler = () => {
            resolve();
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', errorHandler);
          };

          const errorHandler = (error) => {
            reject(error);
            audio.removeEventListener('canplaythrough', loadHandler);
            audio.removeEventListener('error', errorHandler);
          };

          audio.addEventListener('canplaythrough', loadHandler);
          audio.addEventListener('error', errorHandler);
          audio.load();
        });

        if (wasPlaying) {
          try {
            await audio.play();
            setIsPlaying(true);
          } catch (playError) {
            console.error("Could not auto-play next song:", playError);
            setIsPlaying(false);
          }
        }
      } else {
        await fetchSong();
      }
    } catch (err) {
      console.error("Error in handleNext:", err);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  }, [currentSongIndex, isPlaying, hasNext, getNextInQueue, getFormattedSongData]);

  /*
  Manage backward navigation through song history (doesn't affect queue history as of now, will only start at the end of queue)
  Resets current song if within 2 seconds otherwise move to previous song; important to note it doesn't reset queue position 
  */
  const handlePrevious = useCallback(async () => {
    try {
      if (currentTime > 2) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      } else if (currentSongIndex > 0) { 
        const previousSong = songHistory[currentSongIndex - 1];

        setSongData(previousSong);
        setCurrentSongIndex(prev => prev - 1);

        audioRef.current.src = previousSong.audioUrl;
        await prepareSongForPlayback(previousSong);

        if (isPlaying) {
          await audioRef.current.play();
        }
      }
    } catch (err) {
      console.error("Error in handlePrevious:", err);
    }
  }, [currentTime, currentSongIndex, songHistory, isPlaying]);


  /*
  Queue initialization when first loading the component
  */
  useEffect(() => {
    fetchQueue();
  }, []);

  /*
  Load the first song -->WHEN<-- the queue becomes available then check for queue content
  Format the first song --> initialize the player with the first song --> then prepare audio playback
  */
  useEffect(() => {
    const initializeFirstSong = async () => {
      if (queue.length > 0) {
        const firstSong = queue[0];
        const songData = await getFormattedSongData(firstSong.title);

        if (songData) {
          setSongData(songData.formattedData);
          setSongHistory(prev => [...prev, songData.formattedData]);
          setCurrentSongIndex(0);
          audioRef.current.src = songData.formattedData.audioUrl;
          await songData.prepareForPlayback();
        }
      }
    };

    initializeFirstSong();
  }, [queue]);

  /*
  Track whenever the current song ends then automatically go to the next song.
  */
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = async () => {
      const wasPlaying = isPlaying;
      setIsPlaying(false);
      await handleNext();
      if (wasPlaying) {
        setIsPlaying(true);
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [handleNext, isPlaying]);

  /*
  Clean audio and stop playback when component is not loaded 
  */
  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
    };
  }, []);

  /*
  Manage play and pause transitions as well as the play promises. Prevent any state conflicts during loading
  */
  useEffect(() => {
    if (isLoading || !audioRef.current.src) return;

    let playPromise;
    const handlePlayPause = async () => {
      try {
        if (isPlaying && audioRef.current.paused) {
          if (playPromise) {
            await playPromise;
          }
          playPromise = audioRef.current.play();
          if (playPromise) {
            await playPromise;
          }
        } else if (!isPlaying && !audioRef.current.paused) {
          if (playPromise) {
            await playPromise;
          }
          audioRef.current.pause();
        }
      } catch (err) {
        if (!err.message.includes('aborted')) {
          console.error("Error in play/pause handling:", err);
          setIsPlaying(false);
        }
      }
    };

    handlePlayPause();
  }, [isPlaying, isLoading]);

  /*
  Set up all the audio event listeners (manage audio metadata loading --> update time/duration --> handle playback --> manage can playthrough)
  */
  useEffect(() => {
    const audio = audioRef.current;
    const handleLoadedData = async () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);

      if (isPlaying) {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          if (!err.message.includes('aborted')) {
            console.error("Error auto-playing after load:", err);
            setIsPlaying(false);
          }
        }
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleCanPlayThrough = async () => {
      if (isPlaying && audio.paused) {
        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (err) {
          if (!err.message.includes('aborted')) {
            console.error("Error playing on canplaythrough:", err);
            setIsPlaying(false);
          }
        }
      }
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [isPlaying]);


  /*
  Handle new changes in the volume (these will be passed into the VolumeControl component)
  */
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleTimeUpdate = (newTime) => {
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };


  /*
  Format the time, we are provided seconds through the API, but we want a more readable format. 
  */
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };


  /*
  HTML or styling of the components. Will return all the HTML elements once initialized.
  Not much logic here, but lots of building blocks for base components.
  */
  return (
    <div className="player">
      {isLoading && <div className="loading-indicator">Loading...</div>}
      <div className="player-info">
        <img src={songData?.coverArtUrl} className="album-cover" />
        <div>
          <h3 className="song-title">{songData?.title}</h3>
          <p className="artist-name">{songData?.artist}</p>
        </div>
      </div>
      <div className='controls-container'>
        <span className="time-display left">{formatTime(currentTime)}</span>
        <ProgressBar currentTime={currentTime} duration={duration} onTimeUpdate={handleTimeUpdate} />
        <span className="time-display right">{formatTime(duration)}</span>
        <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
      </div>
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} onPrevious={handlePrevious} onNext={handleNext} />
    </div>
  );
}

export default Player;