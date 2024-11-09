import { createContext, useContext, useState } from 'react';

const QueueContext = createContext();

export function QueueProvider({ children }) {
    const [queue, setQueue] = useState([]);
    const [currentQueuePosition, setCurrentQueuePosition] = useState(null);

    const formatSongData = (songDetails) => {
        const filename = songDetails.path.split('\\').pop();
        const audioUrl = `http://127.0.0.1:5000/api/audio/${filename}`;
        const coverArtUrl = `http://127.0.0.1:5000/api/cover_art/${songDetails.cover_art.split('/').pop()}`;

        return {
            ...songDetails,
            audioUrl,
            coverArtUrl
        };
    };


    const fetchQueue = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/queue');
            const data = await response.json();
            setQueue(data);

            if (data.length > 0) {
                setCurrentQueuePosition(data[0].position);
            }
        } catch (err) {
            console.error(err);
        }
    };


    const fetchSongDetails = async (songName) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/song/${encodeURIComponent(songName)}`);
            if (!response.ok) {
                throw new Error('Song not found');
            }
            const songDetails = await response.json();
            return formatSongData(songDetails);
        } catch (err) {
            console.error(err);
            return null;
        }
    };


    const prepareSongForPlayback = async (songDetails) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = songDetails.audioUrl;
            audio.addEventListener('canplaythrough', () => resolve(songDetails), { once: true });
        });
    };


    const getFormattedSongData = async (songName) => {
        const songDetails = await fetchSongDetails(songName);
        if (songDetails) {
            return {
                formattedData: songDetails,
                prepareForPlayback: () => prepareSongForPlayback(songDetails)
            };
        }
        return null;
    };


    const addToQueue = async (songName) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/add_to_queue', {
                method: 'POST', headers: {'Content-Type': 'application/json',}, body: JSON.stringify({ song_name: songName })
            });

            if (!response.ok) {
                throw new Error('Failed to add song to queue');
            }

            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };


    const removeFromQueue = async (position) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/remove_from_queue', {
                method: 'DELETE', headers: {'Content-Type': 'application/json',}, body: JSON.stringify({ position: position })
            });

            if (!response.ok) {
                throw new Error('Failed to remove song from queue');
            }

            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };


    const getNextInQueue = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            return queue[currentIndex + 1];
        }
        return null;
    };


    const getPreviousInQueue = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex > 0) {
            return queue[currentIndex - 1];
        }
        return null;
    };


    const hasNext = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex !== -1 && currentIndex < queue.length - 1;
    };


    const hasPrevious = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex > 0;
    };


    const value = {
        queue,
        currentQueuePosition,

        setQueue,
        setCurrentQueuePosition,

        fetchQueue,
        addToQueue,
        removeFromQueue,
        fetchSongDetails,

        getNextInQueue,
        getPreviousInQueue,
        hasNext,
        hasPrevious,

        formatSongData,
        getFormattedSongData,
        prepareSongForPlayback
    };

    return (
        <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
    );
}

export function useQueue() {
    const context = useContext(QueueContext);
    if (context === undefined) {
        throw new Error('Missing context');
    }
    return context;
}

export default QueueContext;