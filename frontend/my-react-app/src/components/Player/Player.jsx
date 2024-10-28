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
  const [songHistory, setSongHistory] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  const audioRef = useRef(new Audio());
  // const intervalRef = useRef();

  let apiUrl = 'http://127.0.0.1:5000/api/random_song';

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

  useEffect(() => {
    fetchSong();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentSongIndex, songHistory]);

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
        <ProgressBar currentTime={currentTime} duration={duration} onTimeUpdate={handleTimeUpdate} />
        <span className="time-display right">{formatTime(duration)}</span>
        <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />
      </div>
      <PlayerControls isPlaying={isPlaying} setIsPlaying={setIsPlaying} onPrevious={handlePrevious} onNext={handleNext} />
    </div>
  );
}

export default Player;