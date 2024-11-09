/*
Artifact(s): Play Button, Stop Button, Next Button, Prev Button, Progress Bar, Volume Button, Artist Name, Song Title
Description: React component that's built up of multiple components to provide the complete music player that can run independently. 
Name: Anil Thapa
Date: 10/26/2024
Revised: 10/27/2024 (Integrating with Backend -- Anil)
Preconditions: N/A
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
    getPreviousInQueue,
    hasNext,
    hasPrevious,
    getFormattedSongData,
  } = useQueue();

  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songHistory, setSongHistory] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  const audioRef = useRef(new Audio());

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


  const handleNext = useCallback(async () => {
    try {
      console.log(queue, getNextInQueue());
      if (hasNext()) {
        const nextQueueSong = getNextInQueue();
        const songData = await getFormattedSongData(nextQueueSong.title);

        if (songData) {
          setSongData(songData.formattedData);
          setSongHistory(prev => [...prev.slice(0, currentSongIndex + 1), songData.formattedData]);
          setCurrentSongIndex(prev => prev + 1);
          setCurrentQueuePosition(nextQueueSong.position);

          audioRef.current.src = songData.formattedData.audioUrl;
          await songData.prepareForPlayback();

          if (isPlaying) {
            await audioRef.current.play();
          }
        }
      } else {
        await fetchSong();
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentSongIndex, isPlaying]);


  const handlePrevious = useCallback(async () => {
    try {
      if (currentTime > 2) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      } else if (hasPrevious()) {
        const prevQueueSong = getPreviousInQueue();
        const songData = await getFormattedSongData(prevQueueSong.title);

        if (songData) {
          setSongData(songData.formattedData);
          setCurrentSongIndex(prev => prev - 1);
          setCurrentQueuePosition(prevQueueSong.position);

          audioRef.current.src = songData.formattedData.audioUrl;
          await songData.prepareForPlayback();

          if (isPlaying) {
            await audioRef.current.play();
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [currentTime, hasPrevious, getPreviousInQueue, getFormattedSongData, isPlaying]);


  /*
  At the beginning with [] empty dependency, run fetchSong() to grab our first song when starting.
  */
  useEffect(() => {
    fetchQueue();
  }, []);


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
  Whenever there is a change to our index or songHistory, make sure that the music player moves forward.
  */
  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentSongIndex, songHistory, handleNext]);


  /*
  Initialize the audio's event listeners to account for any changes in the data or time.
  This occurs at the beginning and doesn't need to be initialized again since it's just function setups. 
  */
  useEffect(() => {
    const audio = audioRef.current;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setTimeUpdate);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setTimeUpdate);
    };
  }, []);


  /*
  Simple check for isPlaying. If the user clicks the play button, then it is playing so start the audio.
  Otherwise, do the opposite.
  */
  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
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
      <div className="player-info">
        <img src={songData?.coverArtUrl} className="album-cover" />
        <div className="song-info">
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