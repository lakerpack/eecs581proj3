import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const QueueContext = createContext();

export function QueueProvider({ children }) {
    const [queue, setQueue] = useState([]);
    const [currentQueuePosition, setCurrentQueuePosition] = useState(null);

    const fetchQueue = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/queue');
            const data = await response.json();
            
            if (data.length > 0) {
                setQueue(data);
                if (currentQueuePosition === null) {
                    setCurrentQueuePosition(data[0].position);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };


    const getNextInQueue = useCallback(() => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            return queue[currentIndex + 1];
        }
        return null;
    }, [queue, currentQueuePosition]);


    const hasNext = useCallback(() => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex !== -1 && currentIndex < queue.length - 1;
    }, [queue, currentQueuePosition]);


    useEffect(() => {
        if (currentQueuePosition !== null) {
            fetchQueue();
        }
    }, [currentQueuePosition]);


    useEffect(() => {
        if (queue.length > 0 && currentQueuePosition !== null) {
            const updatedQueue = queue.filter(song => song.position >= currentQueuePosition);
            if (updatedQueue.length !== queue.length) {
                setQueue(updatedQueue);
            }
        }
    }, [currentQueuePosition, queue]);


    const addToQueue = async (songTitle) => {
        try {
            let nextPosition = 1;
            if (queue.length > 0) {
                nextPosition = queue[queue.length - 1].position + 1;
            }
    
            const response = await fetch('http://127.0.0.1:5000/api/add_to_queue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    song_name: songTitle
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to add song to queue');
            }
    
            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };


    const updateQueuePosition = (position) => {
        setCurrentQueuePosition(position);
    };


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


    const getPreviousInQueue = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex > 0) {
            return queue[currentIndex - 1];
        }
        return null;
    };



    const hasPrevious = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex > 0;
    };


    const value = {
        queue,
        currentQueuePosition,
        setCurrentQueuePosition: updateQueuePosition,  
        fetchQueue,
        getNextInQueue,
        getPreviousInQueue,
        hasNext,
        hasPrevious,
        getFormattedSongData,
        prepareSongForPlayback,
        addToQueue,
        removeFromQueue
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