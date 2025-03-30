import logging
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
import stripe
import os
import openai
from dotenv import load_dotenv
from database import get_db, init_db, User, Message, DailyMessageCount, Chat
from pydantic import BaseModel
from typing import List, Optional, Tuple
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import random
from config import MESSAGE_LIMIT, TIME_FRAME, TIME_FRAME_HOURS

# Load environment variables
load_dotenv()

# Set up OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class MessageCreate(BaseModel):
    content: str

class UserCreate(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ChatUpdate(BaseModel):
    title: str

# Auth functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Message limit checking
async def check_message_limit(user: User, db: Session) -> Tuple[bool, int]:
    # Premium users have no limit
    if user.is_premium:
        return True, 0

    # Get the time threshold for counting messages
    hours = TIME_FRAME_HOURS[TIME_FRAME]  # Get hours from the mapping
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    # Count messages in the time frame
    count = db.query(Message).filter(
        Message.user_id == user.id,
        Message.timestamp >= time_threshold,
        Message.is_bot == False
    ).count()
    
    return count < MESSAGE_LIMIT, count

# Routes
@app.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Input validation
        if not user.email or not user.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
            
        # Check if user already exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = pwd_context.hash(user.password)
        db_user = User(email=user.email, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Return token directly so user doesn't have to login separately
        access_token = create_access_token({"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Error during registration")

@app.post("/token")
def login(user: UserCreate, db: Session = Depends(get_db)):
    try:
        if not user.email or not user.password:
            raise HTTPException(status_code=400, detail="Email and password are required")
            
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = create_access_token({"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Error during login")

@app.post("/chat")
async def chat(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Processing chat message for user {current_user.id}")
    
    # Calculate the start of the time frame
    hours = TIME_FRAME_HOURS[TIME_FRAME]  # Get hours from the mapping
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Get messages in the time frame
    message_count = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.is_bot == False,
        Message.timestamp >= start_time
    ).count()
    
    logger.info(f"Starting count for user {current_user.id}: {message_count}")
    
    # Check if we can process message
    if message_count + 1 > MESSAGE_LIMIT:
        logger.warning(f"Message limit reached for user {current_user.id}. Count: {message_count}")
        return JSONResponse(
            status_code=402,
            content={
                "detail": "Message limit reached",
                "upgrade_required": True,
                "current_count": message_count,
                "time_frame": TIME_FRAME
            }
        )

    try:
        # Add user message
        user_message = Message(
            content=message.content,
            user_id=current_user.id,
            is_bot=False,
            timestamp=datetime.utcnow()
        )
        db.add(user_message)
        db.commit()
        
        # Get updated count
        new_count = db.query(Message).filter(
            Message.user_id == current_user.id,
            Message.is_bot == False,
            Message.timestamp >= start_time
        ).count()
        
        logger.info(f"Added user message. Count now: {new_count}")
        
        # Add bot message
        bot_response = "Hello! I'm your chatbot assistant. How can I help you today?"
        bot_message = Message(
            content=bot_response,
            user_id=current_user.id,
            is_bot=True,
            timestamp=datetime.utcnow()
        )
        db.add(bot_message)
        db.commit()
        logger.info(f"Added bot message. Final count: {new_count}")

        remaining_messages = max(0, MESSAGE_LIMIT - new_count)
        return {
            "bot_message": bot_response,
            "remaining_messages": remaining_messages,
            "current_count": new_count,
            "time_frame": TIME_FRAME
        }
    except Exception as e:
        logger.error(f"Error processing message for user {current_user.id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error processing message")

@app.get("/message-count")
async def get_message_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Premium users always show 0 count
    if current_user.is_premium:
        return {
            "current_count": 0,
            "time_frame": TIME_FRAME
        }

    # Get count for non-premium users
    _, count = await check_message_limit(current_user, db)
    return {
        "current_count": count,
        "time_frame": TIME_FRAME
    }

@app.get("/messages")
async def get_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get all messages for the user, ordered by timestamp
    messages = db.query(Message).filter(
        Message.user_id == current_user.id
    ).order_by(Message.timestamp.asc()).all()
    
    return [{
        "content": msg.content,
        "is_bot": msg.is_bot,
        "timestamp": msg.timestamp
    } for msg in messages]

@app.get("/user")
async def get_user_info(current_user: User = Depends(get_current_user)):
    return {
        "email": current_user.email,
        "is_premium": current_user.is_premium
    }

@app.post("/create-checkout-session")
async def create_checkout_session(current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Creating checkout session for user {current_user.id}")
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'Premium Subscription',
                        'description': 'Unlimited messages, priority support, and advanced features',
                    },
                    'unit_amount': 999,  # $9.99 in cents
                    'recurring': {
                        'interval': 'month'
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:3000/success',
            cancel_url='http://localhost:3000/cancel',
            customer_email=current_user.email,
            metadata={
                'user_id': str(current_user.id)
            }
        )
        logger.info(f"Created checkout session: {session.id}")
        return {"url": session.url}
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # Get webhook secret from environment variable
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Update user to premium
        user_id = session["metadata"]["user_id"]
        if user_id:
            db = next(get_db())
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_premium = True
                db.commit()
                logger.info(f"User {user_id} upgraded to premium")

    return {"status": "success"}

@app.post("/chats")
async def create_chat(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = Chat(
        title="New Chat",
        user_id=current_user.id
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

@app.get("/chats")
async def get_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = db.query(Chat).filter(
        Chat.user_id == current_user.id
    ).order_by(Chat.created_at.desc()).all()
    return chats

@app.get("/chats/{chat_id}/messages")
async def get_chat_messages(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify chat belongs to user
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = db.query(Message).filter(
        Message.chat_id == chat_id
    ).order_by(Message.timestamp.asc()).all()
    
    return [{
        "content": msg.content,
        "is_bot": msg.is_bot,
        "timestamp": msg.timestamp
    } for msg in messages]

async def get_bot_response(user_message: str) -> str:
    try:
        client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant. Keep your responses concise and friendly."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting OpenAI response: {e}")
        return "I apologize, but I'm having trouble processing your request right now."

@app.post("/chats/{chat_id}/messages")
async def create_message(
    chat_id: int,
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if chat exists and belongs to user
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # For premium users, skip message limit check
    if current_user.is_premium:
        current_count = 0  # Premium users don't have a limit
    else:
        # Check message limit for non-premium users
        can_send, current_count = await check_message_limit(current_user, db)
        if not can_send:
            return {
                "detail": "Message limit reached",
                "upgrade_required": True,
                "current_count": current_count,
                "time_frame": TIME_FRAME
            }

    try:
        # Add user message
        user_message = Message(
            content=message.content,
            chat_id=chat_id,
            user_id=current_user.id,
            is_bot=False
        )
        db.add(user_message)
        db.commit()

        # Get bot response
        bot_message_content = await get_bot_response(message.content)

        # Add bot message
        bot_message = Message(
            content=bot_message_content,
            chat_id=chat_id,
            user_id=current_user.id,
            is_bot=True
        )
        db.add(bot_message)
        db.commit()

        # Only increment count for non-premium users
        if not current_user.is_premium:
            current_count += 1

        return {
            "bot_message": bot_message_content,
            "current_count": current_count,
            "time_frame": TIME_FRAME
        }
    except Exception as e:
        logger.error(f"Error creating message: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/chats/{chat_id}")
async def update_chat(
    chat_id: int,
    chat_update: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify chat belongs to user
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    chat.title = chat_update.title
    db.commit()
    db.refresh(chat)
    return chat

# Initialize database
init_db()
