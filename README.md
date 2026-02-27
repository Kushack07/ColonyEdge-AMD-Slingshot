# ColonyEdge Security Prototype

A privacy-first, Edge AI computer vision system simulating execution on an AMD Ryzen AI NPU.
Monitors a local CCTV video feed to detect unauthorized parking (cars) and stray animal threats (dogs).

## Prerequisites
- **Node.js**: Installed on your system to run the frontend (`v16+` recommended).
- **Python 3.9+**: Installed on your system to run the backend.

## Setup & Execution Instructions

### 1. Download Mock Video Data

Before running anything, you **MUST** download a short MP4 video clip (e.g., from YouTube) of a stray dog or a car parking. 
Rename the file **exactly** to `mock_cctv.mp4` and place it directly inside the `backend/` folder.

### 2. Backend Setup (Computer Vision Edge Node)

Open a terminal and navigate to the project directory:

```bash
cd "ColonyEdge/backend"

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install required packages
pip install -r requirements.txt

# Start the Application
python main.py
```

### 3. Frontend Setup (Security Dashboard)

Open a **new, separate terminal** and navigate to the project directory:

```bash
cd "ColonyEdge/frontend"

# Install standard React + Tailwind CSS dependencies
npm install

# Start the Vite development server
npm run dev
```

### 4. View the Application

Once both servers are running:
1. Ensure your `mock_cctv.mp4` is inside the `backend` folder.
2. The UI will be available at `http://localhost:5173`.
3. The dashboard connects via WebSocket to the NPU inference node and will display live alerts when a Dog (red alert) or Car (yellow alert) is detected in the video stream.
