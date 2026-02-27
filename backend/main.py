import asyncio
import cv2
import time
import json
import uuid
import os
import random
import threading
import queue
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 Nano model
model = YOLO('yolov8n.pt')

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"Error sending message to client: {e}")
                self.disconnect(connection)

manager = ConnectionManager()
alert_queue = queue.Queue()

COOLDOWN_SECONDS = 5
last_alert_time = {
    2: 0, # Car
    16: 0 # Dog
}

PARKING_ALLOCATIONS = {
    "Slot_A1": "Flat 101", 
    "Slot_A2": "Flat 102", 
    "Slot_B1": "Flat 205"
}

def generate_alert(class_id):
    timestamp_now = datetime.now()
    if class_id == 16:
        return {
            "id": str(uuid.uuid4()),
            "timestamp": timestamp_now.strftime("%H:%M:%S"),
            "type": "Stray Dog Pack",
            "camera": "Children's Play Area",
            "severity": "red",
            "message": "CRITICAL: Stray dog pack breached restricted zone."
        }
    elif class_id == 2:
        slot = random.choice(list(PARKING_ALLOCATIONS.keys()))
        flat_owner = PARKING_ALLOCATIONS[slot]
        return {
            "id": str(uuid.uuid4()),
            "timestamp": timestamp_now.strftime("%H:%M:%S"),
            "type": "Unauthorized Parking",
            "camera": "Basement Level 1",
            "severity": "yellow",
            "slot": slot.replace("_", " "),
            "flat_owner": flat_owner,
            "message": f"WARNING: Unknown vehicle parked in reserved space allocated to {flat_owner}."
        }
    return None

def run_vision_loop():
    print("\n" + "="*50)
    print("Starting LIVE webcam on MAIN THREAD for Mac compatibility...")
    print("Press 'q' in the video window to exit.")
    print("="*50 + "\n")
    
    cap = cv2.VideoCapture(0)
    time.sleep(2)
    
    if not cap.isOpened():
        print("Error: Could not open webcam. Please ensure Terminal/VSCode has Camera permissions in Mac System Settings.")
        return

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame from webcam. Retrying...")
            time.sleep(1)
            continue
            
        results = model.predict(frame, stream=True, verbose=False)
        current_time = time.time()
        
        frame_with_boxes = frame
        
        for r in results:
            frame_with_boxes = r.plot()
            boxes = r.boxes
            if boxes is None:
                continue
                
            for box in boxes:
                cls_id = int(box.cls[0].item())
                if cls_id in [2, 16]:
                    if current_time - last_alert_time[cls_id] >= COOLDOWN_SECONDS:
                        last_alert_time[cls_id] = current_time
                        alert_data = generate_alert(cls_id)
                        
                        if alert_data:
                            print(f"Alert Generated: {alert_data['type']}")
                            alert_queue.put(alert_data)
        
        cv2.imshow("AMD Edge NPU - Live Feed", frame_with_boxes)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    os._exit(0)

async def alert_broadcaster():
    while True:
        while not alert_queue.empty():
            alert_data = alert_queue.get()
            await manager.broadcast(json.dumps(alert_data))
        await asyncio.sleep(0.1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(alert_broadcaster())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"status": "ColonyEdge Backend is running."}

if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI server in a background thread
    def start_api():
        uvicorn.run(app, host="0.0.0.0", port=8000)
        
    api_thread = threading.Thread(target=start_api, daemon=True)
    api_thread.start()
    
    # Run the OpenCV webcam capture and window rendering in the Main Thread exactly as Mac OS requires
    run_vision_loop()
