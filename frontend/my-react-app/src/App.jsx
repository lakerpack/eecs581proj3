/*
Artifact(s): App Start
Description: Starts the React App after being run in index.html.
Name: Anil Thapa
Date: 10/26/2024
Revised: N/A
Preconditions: N/A
Postconditions: Starts React
Error and exception conditions: Typos
Side effects: N/A
*/

import './App.css'
import Navbar from './components/Navbar/Navbar'
import Player from './components/Player/Player'
import QueueManager from './components/QueueManager/QueueManager'
import { QueueProvider } from './context/QueueContext' 

function App() {
    return (
        <QueueProvider>
            <div>
                <Navbar/>
                <QueueManager>
                    <div className="player-section">
                        <Player/>
                    </div>
                </QueueManager>
            </div>
        </QueueProvider>
    );
}

export default App
