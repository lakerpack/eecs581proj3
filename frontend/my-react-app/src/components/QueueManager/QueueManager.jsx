import { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import './QueueManager.css';

function QueueManager({ children }) {
    const {
        queue,
        currentQueuePosition,
        fetchQueue,
        addToQueue,
        removeFromQueue
    } = useQueue();


    const filteredQueue = useMemo(() => {
        return queue.filter(song => song.position >= currentQueuePosition);
    }, [queue, currentQueuePosition]);


    useEffect(() => {
        const fetchAvailableSongs = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/all_songs');
                const data = await response.json();
                setAvailableSongs(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchAvailableSongs();
    }, []);


    useEffect(() => {
        const updateQueue = async () => {
            await fetchQueue();
        };
        updateQueue();
    }, [currentQueuePosition]); 


    const handleAddToQueue = async (songTitle) => {
        try {
            const currentPosition = currentQueuePosition; 
            await addToQueue(songTitle);
            await fetchQueue();
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        fetchQueue();
    }, []); 


    const handleRemoveFromQueue = async (position) => {
        try {
            await removeFromQueue(position);
            await fetchQueue();  
        } catch (err) {
            console.error(err);
        }
    };


    useEffect(() => {
        console.log('Queue updated:', queue);
    }, [queue]);


    return (
        <div className="queue-manager">
            <div className="library-section">
                <h2>Library</h2>
                <div className="available-songs">
                    {availableSongs.map((song) => (
                        <div key={`library-${song.id}-${song.title}`} className="song-item">
                            <div className="song-info">
                                <img src={`http://127.0.0.1:5000/api/cover_art/${song.cover_art.split('/').pop()}`} alt={song.title} className="song-cover"/>
                                <div className="song-details">
                                    <h3>{song.title}</h3>
                                    <p>{song.artist}</p>
                                </div>
                            </div>
                            <button className="add-button" onClick={() => handleAddToQueue(song.title)}>+</button>
                        </div>
                    ))}
                </div>
            </div>
            {children}
            <div className="queue-section">
                <h2>Queue ({filteredQueue.length} remaining)</h2>
                <div className="queue-list">
                    {filteredQueue.map((song) => (
                        <div key={`queue-${song.position}-${song.title}`} className={`queue-item ${song.position === currentQueuePosition ? 'current-song' : ''}`}>
                            <div className="song-info">
                                <span className="position">{song.position}</span>
                                <div className="song-details">
                                    <h3>{song.title}</h3>
                                </div>
                            </div>
                            <button className="remove-button" onClick={() => handleRemoveFromQueue(song.position)}>×</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default QueueManager;