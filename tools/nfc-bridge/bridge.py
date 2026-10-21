import asyncio, json, threading, time
from smartcard.System import readers
import websockets

GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
clients = set()
loop = None

def read_uid():
    try:
        rs = readers()
        if not rs:
            return None
        reader = next((r for r in rs if "ACR122" in str(r)), rs[0])
        conn = reader.createConnection()
        conn.connect()
        data, sw1, sw2 = conn.transmit(GET_UID)
        conn.disconnect()
        if (sw1, sw2) == (0x90, 0x00):
            return ":".join(f"{b:02X}" for b in data)
    except Exception:
        pass
    return None

async def broadcast(msg):
    for ws in list(clients):
        try:
            await ws.send(msg)
        except Exception:
            clients.discard(ws)

def poll():
    last, misses = None, 0
    while True:
        uid = read_uid()
        if uid:
            misses = 0
            if uid != last:  # 올려둔 카드는 한 번만 전송
                last = uid
                print("TAP", uid)
                asyncio.run_coroutine_threadsafe(
                    broadcast(json.dumps({"type": "tap", "uid": uid})), loop)
        else:
            misses += 1
            if misses >= 3:  # 카드를 뗐다고 판단
                last = None
        time.sleep(0.25)

async def handler(ws):
    clients.add(ws)
    try:
        await ws.wait_closed()
    finally:
        clients.discard(ws)

async def main():
    global loop
    loop = asyncio.get_running_loop()
    threading.Thread(target=poll, daemon=True).start()
    async with websockets.serve(handler, "127.0.0.1", 8765):
        print("NFC bridge 실행 중 ws://127.0.0.1:8765")
        await asyncio.Future()

asyncio.run(main())