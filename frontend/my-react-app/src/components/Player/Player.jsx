import './Player.css'
import PlayerControls from './PlayerControls'
import ProgressBar from './ProgressBar'
import VolumeControl from './VolumeControl'

import { useState, useRef, useEffect } from 'react'

import defaultImage from '../../assets/default.png'

function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songData, setSongData] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef(new Audio());
  const intervalRef = useRef();

  let apiUrl = 'http://127.0.0.1:5000/api/random_song';

  useEffect(() => {
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

        audioRef.current.src = audioUrl;
      } catch (err) {
        console.error(err);
      }
    };
    fetchSong();
  }, []);


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

  useEffect(() => {
    if (songData) {
      audioRef.current.src = songData.audioUrl;
    }
  }, [songData]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleTimeUpdate = (newTime) => {
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
        <ProgressBar isPlaying={isPlaying} currentTime={currentTime} duration={duration} onTimeUpdate={handleTimeUpdate} />
        <span className="time-display right">{formatTime(duration)}</span>
        <VolumeControl />
      </div>
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    </div>
  );
}

export default Player;