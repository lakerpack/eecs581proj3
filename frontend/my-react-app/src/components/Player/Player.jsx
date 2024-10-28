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

import { useState, useRef, useEffect } from 'react'

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [songHistory, setSongHistory] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  const audioRef = useRef(new Audio());
  // const intervalRef = useRef();

  let apiUrl = 'http://127.0.0.1:5000/api/random_song';

  /*
  Fetch from the Flask backend using the apiUrl and initialize songData. 
  Add the songData to the history and set index.
  */
  const fetchSong = async () => {
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const filename = data.path.split('\\').pop();
      const audioUrl = `http://127.0.0.1:5000/api/audio/${filename}`;

      setSongData({
        ...data,
        audioUrl: audioUrl
      });

      setSongHistory(prev => [...prev.slice(0, currentSongIndex + 1), data]);
      setCurrentSongIndex(prev => prev + 1);

      audioRef.current.src = audioUrl;
    } catch (err) {
      console.error(err);
    }
  };

  /*
  Handle previous songs in the history with an async function to determine
  1. Is there a previous song?
  2. Is the time > 2 (to prevent double clicks)
  Then move forward by going to the previous song and playing if the music was already playing.
  */
  const handlePrevious = async () => {
    if (currentSongIndex > 0) {
      if (currentTime > 2) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      } else {
        const previousSong = songHistory[currentSongIndex - 1];
        const filename = previousSong.path.split('\\').pop();
        const audioUrl = `http://127.0.0.1:5000/api/audio/${filename}`;

        setSongData({
          ...previousSong,
          audioUrl: audioUrl
        });

        audioRef.current.currentTime = 0;
        setCurrentTime(0);

        setCurrentSongIndex(prev => prev - 1);
        await new Promise((resolve) => {
          audioRef.current.src = audioUrl;
          audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
        });
        if (isPlaying) {
          await audioRef.current.play();
        }
      }
    }
  };

  /*
  Similarly to handlePrevious, but instead we do another fetchSong() call to do an API call to our backend.
  This creates a random song that we use to move on, but we have to await for it to load since it is async.
  */
  const handleNext = async () => {
    if (currentSongIndex < songHistory.length - 1) {
      const nextSong = songHistory[currentSongIndex + 1];
      const filename = nextSong.path.split('\\').pop();
      const audioUrl = `http://127.0.0.1:5000/api/audio/${filename}`;

      setSongData({
        ...nextSong,
        audioUrl: audioUrl
      });

      setCurrentSongIndex(prev => prev + 1);
      audioRef.current.src = audioUrl;
    } else {
      await fetchSong();
      await new Promise((resolve) => {
        audioRef.current.addEventListener('canplaythrough', resolve, { once: true });
      });
    }
    if (isPlaying) {
      await audioRef.current.play();
    }
  };

  /*
  At the beginning with [] empty dependency, run fetchSong() to grab our first song when starting.
  */
  useEffect(() => {
    fetchSong();
  }, []);

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
  }, [currentSongIndex, songHistory]);

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
        <img
          src={defaultImage}
          className="album-cover"
        />
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