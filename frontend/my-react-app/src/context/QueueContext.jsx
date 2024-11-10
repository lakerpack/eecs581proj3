import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const QueueContext = createContext();

/*
In order to manage states between the QueueManager and the Player components so any interactions between
the QueueManager and the queue and then the Player and the queue are reflected accurately between the two.
We share context so queue management gets centralized when before it was just in Player, and we can use QueueManager to modify
the queue even as Player reads from it. 
Manages the queue (current list of songs) and currentQueuePosition (current playing position).
Player is intended to read the queue and position for its songs, whle the QueueManager displays and modifies the queue.
*/

export function QueueProvider({ children }) {
    const [queue, setQueue] = useState([]);
    const [currentQueuePosition, setCurrentQueuePosition] = useState(null);

    /*
    Retrieves the current queue from the backend using 'http://127.0.0.1:5000/api/queue'. 
    Set initial position for the Player and updates queue data overall. Just meant to ensure a consistent state.
    */
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

    /*
    Moved from Player for consistency with QueueManager. Allows the player to navigate the queue without needing to
    maintain the queue state. (Instead QueueManager will do the bulk of the work)
    */
    const getNextInQueue = useCallback(() => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex !== -1 && currentIndex < queue.length - 1) {
            return queue[currentIndex + 1];
        }
        return null;
    }, [queue, currentQueuePosition]);

    /*
    Determine if there's anything else in the queue 
    */
    const hasNext = useCallback(() => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex !== -1 && currentIndex < queue.length - 1;
    }, [queue, currentQueuePosition]);


    /*
    If the position has been initialized, retrieve current queue every time you move. 
    */
    useEffect(() => {
        if (currentQueuePosition !== null) {
            fetchQueue();
        }
    }, [currentQueuePosition]);

    /*
    Whenever the queue position moves, make sure that the queue gets updated so everything before it gets cut off. 
    */
    useEffect(() => {
        if (queue.length > 0 && currentQueuePosition !== null) {
            const updatedQueue = queue.filter(song => song.position >= currentQueuePosition);
            if (updatedQueue.length !== queue.length) {
                setQueue(updatedQueue);
            }
        }
    }, [currentQueuePosition, queue]);

    /*
    Let QueueManager update the queue with additions and also updates Player's available songs. 
    */
    const addToQueue = async (songTitle) => {
        try {
            let nextPosition = 1;
            if (queue.length > 0) {
                nextPosition = queue[queue.length - 1].position + 1;
            }
    
            const response = await fetch('http://127.0.0.1:5000/api/add_to_queue', {
                method: 'POST', headers: {'Content-Type': 'application/json',}, body: JSON.stringify({ song_name: songTitle})
            });
    
            if (!response.ok) {
                throw new Error('Failed to add song to queue');
            }
    
            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };

    /*
    Update position 
    */
    const updateQueuePosition = (position) => {
        setCurrentQueuePosition(position);
    };

    /*
    Format the song data since the pathing can be wonky. Two endpoints serve the direct audio file and the direct art cover file.
    Centralize prep so not too many reuses of the same code in Player. 
    */
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

    /*
    Get the current song from the song name. Used when we're iterating over the queue and we need to get
    the song at the current index. We're provided with position and name from the queue, so we just use the name for this info. 
    */
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

    /*
    Centralize prep for the Audio object. 
    */
    const prepareSongForPlayback = async (songDetails) => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.src = songDetails.audioUrl;
            audio.addEventListener('canplaythrough', () => resolve(songDetails), { once: true });
        });
    };

    /*
    Getter for the formatted song data. 
    */
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

    /*
    Remove from the queue by sending the position. Endpoint takes in a position to remove,
    the queue we have in context is made up of [(position ,song_name)...]
    */
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

    /*
    Backtrack and get the previous song in the queue. 
    */
    const getPreviousInQueue = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        if (currentIndex > 0) {
            return queue[currentIndex - 1];
        }
        return null;
    };


    /*
    Determine if there is a previous element. 
    */
    const hasPrevious = () => {
        const currentIndex = queue.findIndex(song => song.position === currentQueuePosition);
        return currentIndex > 0;
    };

    /*
    Values within the context. queue and currentQueuePosition are our values to manage
    The rest are helper functions to deal with the data
    */
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