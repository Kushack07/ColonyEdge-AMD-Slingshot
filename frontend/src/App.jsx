import { useEffect, useState } from 'react';

function App() {
    const [alerts, setAlerts] = useState([]);
    const [latestAlert, setLatestAlert] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let ws;
        let reconnectTimer;

        const connectWebSocket = () => {
            ws = new WebSocket('ws://localhost:8000/ws');

            ws.onopen = () => {
                setIsConnected(true);
                console.log('Connected to ColonyEdge backend');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                setLatestAlert(data);
                setAlerts((prevAlerts) => [data, ...prevAlerts]);
            };

            ws.onclose = () => {
                setIsConnected(false);
                console.log('WebSocket connection closed. Reconnecting...');
                // Attempt to reconnect after 3 seconds
                reconnectTimer = setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                ws.close();
            };
        };

        connectWebSocket();

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimer);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans pb-8">
            {/* Header */}
            <header className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1 drop-shadow-md">ColonyEdge Security Command</h1>
                    <p className="text-sm font-medium text-slate-400">Autonomous Edge Security Network - LIVE Feed</p>
                </div>
                <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
                    <div className="relative flex h-3 w-3">
                        {isConnected ? (
                            <>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </>
                        ) : (
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        )}
                    </div>
                    <span className="text-sm font-semibold tracking-wide text-slate-300">
                        AMD NPU Node: {isConnected ? 'ACTIVE' : 'DISCONNECTED'}
                    </span>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left side: Live NPU Inference (2/3 width) */}
                <section className="col-span-1 lg:col-span-2 flex flex-col rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl relative min-h-[500px]">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-200">Live NPU Inference</h2>
                        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            CAM: {latestAlert ? latestAlert.camera.replace(/\s+/g, '_').toUpperCase() : 'LIVE_WEBCAM'}
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/90 pointer-events-none"></div>

                        {!latestAlert ? (
                            <div className="flex flex-col items-center justify-center z-10 space-y-4">
                                <div className="w-16 h-16 border-4 border-slate-700 border-t-green-500 rounded-full animate-spin"></div>
                                <p className="text-green-500/80 text-lg tracking-[0.2em] font-mono animate-pulse">MONITORING LIVE VIDEO FEED...</p>
                            </div>
                        ) : (
                            <div
                                className={`w-full max-w-2xl p-8 rounded-xl border-2 shadow-2xl z-10 backdrop-blur-sm transition-all duration-300 ${latestAlert.severity === 'red'
                                        ? 'border-red-500/50 bg-red-950/60 shadow-red-900/50'
                                        : 'border-yellow-500/50 bg-yellow-950/60 shadow-yellow-900/50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-md flex items-center gap-2 ${latestAlert.severity === 'red' ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-yellow-500 text-yellow-950 shadow-yellow-500/30'
                                        }`}>
                                        {latestAlert.severity === 'red' ? (
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-yellow-950 animate-pulse"></span>
                                        )}
                                        {latestAlert.type}
                                    </span>
                                    <span className={`font-mono text-2xl font-bold tracking-wider ${latestAlert.severity === 'red' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                        {latestAlert.timestamp}
                                    </span>
                                </div>

                                <h3 className={`text-2xl font-black uppercase mb-6 tracking-wide leading-tight ${latestAlert.severity === 'red' ? 'text-red-500' : 'text-yellow-500'
                                    }`}>
                                    {latestAlert.message}
                                </h3>

                                <div className="mb-8 p-5 bg-slate-950/70 rounded-lg border border-slate-800/50 space-y-3 shadow-inner">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-slate-300 font-mono text-sm mb-1">
                                                <span className="text-slate-500 mr-2">LOCATION:</span>
                                                <span className="font-bold text-slate-100">{latestAlert.camera}</span>
                                            </p>
                                            <p className="text-slate-300 font-mono text-sm">
                                                <span className="text-slate-500 mr-2">EVENT ID:</span>
                                                <span className="text-slate-400">{latestAlert.id.substring(0, 18)}...</span>
                                            </p>
                                        </div>

                                        {latestAlert.severity === 'yellow' && latestAlert.slot && (
                                            <div className="md:border-l md:border-slate-800 md:pl-6 space-y-2">
                                                <p className="font-mono text-sm bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded text-yellow-500 flex items-center shadow-inner">
                                                    <span className="opacity-70 mr-2">RESERVED SLOT:</span>
                                                    <span className="font-bold tracking-wider">{latestAlert.slot}</span>
                                                </p>
                                                <p className="font-mono text-sm bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded text-yellow-500 flex items-center shadow-inner">
                                                    <span className="opacity-70 mr-2">ALLOCATED OWNER:</span>
                                                    <span className="font-bold tracking-wider">{latestAlert.flat_owner}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-4">
                                    <button className="flex-1 py-4 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 font-bold transition-colors uppercase tracking-widest text-sm shadow-lg">
                                        Acknowledge
                                    </button>
                                    <button className={`flex-1 py-4 px-4 rounded-lg font-bold transition-all uppercase tracking-widest text-sm shadow-lg ${latestAlert.severity === 'red'
                                            ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500 hover:shadow-red-500/25'
                                            : 'bg-yellow-500 hover:bg-yellow-400 text-yellow-950 border border-yellow-500 hover:shadow-yellow-500/25'
                                        }`}>
                                        Dispatch Guards
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right side: Threat History Log (1/3 width) */}
                <section className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl h-[600px] lg:h-auto max-h-[700px]">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <h2 className="text-xl font-bold text-slate-200 flex items-center justify-between">
                            Threat History Log
                            <span className="text-xs bg-slate-800 text-slate-400 py-1 px-3 rounded-full font-mono">
                                {alerts.length} Records
                            </span>
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {alerts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                                <p className="font-mono text-sm tracking-widest uppercase">No Events Recorded</p>
                            </div>
                        ) : (
                            alerts.map((alert, idx) => (
                                <div
                                    key={`${alert.id}-${idx}`}
                                    className={`p-4 rounded-xl bg-slate-800/40 border-l-4 transition-all hover:bg-slate-800/80 cursor-default shadow-sm flex flex-col ${alert.severity === 'red' ? 'border-red-500' : 'border-yellow-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-100 text-sm tracking-wide">{alert.type}</span>
                                        <span className="text-xs font-mono text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded">{alert.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono w-full flex items-center gap-1 mt-1">
                                        <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                        {alert.camera}
                                    </p>

                                    {alert.severity === 'yellow' && alert.slot && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                                            <span className="text-[10px] font-mono tracking-wider bg-yellow-900/30 text-yellow-500/80 px-1.5 py-0.5 rounded border border-yellow-700/30">
                                                {alert.slot}
                                            </span>
                                            <span className="text-[10px] font-mono tracking-wider bg-yellow-900/30 text-yellow-500/80 px-1.5 py-0.5 rounded border border-yellow-700/30">
                                                {alert.flat_owner}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default App;
