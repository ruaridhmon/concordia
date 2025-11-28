import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from consensus import routes as consensus_routes
from consensus.db import engine, SessionLocal
from consensus.models import Base, User, UserFormUnlock
from consensus.auth import get_password_hash
from consensus.ws import ws_manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(consensus_routes.router)

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "change-me-now")
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        db.add(User(
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            is_admin=True
        ))
    else:
        admin.is_admin = True
        admin.hashed_password = get_password_hash(admin_password)

    db.commit()

    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        print("❌ Admin user not created")
    else:
        print("✅ Admin user exists:", admin.email)




@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down cleanly")
