import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { MESSAGE_LIMIT, TIME_FRAME } from '../config';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Navbar = styled.nav`
  background-color: #2c3e50;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const NavTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
`;

const NavButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
`;

const NewChatBtn = styled(NavButton)`
  background-color: #28a745;
  color: white;

  &:hover {
    background-color: #218838;
  }
`;

const LogoutButton = styled(NavButton)`
  background-color: #dc3545;
  color: white;

  &:hover {
    background-color: #c82333;
  }
`;

const PremiumButton = styled.button`
  background-color: #ffc107;
  color: #000;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0a800;
  }
`;

const UpgradeButton = styled.button`
  background-color: #e74c3c;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background-color: #c0392b;
  }
`;

const NewChatButton = styled.button`
  background-color: #27ae60;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background-color: #219a52;
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  padding-top: 64px;
  box-sizing: border-box;
  min-height: 0;
`;

const ChatList = styled.div`
  width: 250px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
  overflow-y: auto;
  flex-shrink: 0;
  height: calc(100vh - 64px);
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
  min-height: 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
`;

const ChatItem = styled.div`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.active ? '#e9ecef' : 'transparent'};
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: #e9ecef;
  }
`;

const ChatTitle = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 0.5rem;
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;

  ${ChatItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #495057;
    background-color: #dee2e6;
  }
`;

const EditInput = styled.input`
  width: 100%;
  padding: 0.25rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  margin-right: 0.5rem;

  &:focus {
    outline: none;
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  }
`;

const InputSection = styled.div`
  background: white;
  border-top: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 1rem;
  gap: 0.5rem;
  background: white;
`;

const WarningContainer = styled.div`
  padding: 0.5rem 1rem;
  border-top: 1px solid #dee2e6;
  background: white;
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 4px;
  max-width: calc(100% - 2rem);
  width: fit-content;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
  margin: 0.5rem 0;

  ${props => props.isBot ? `
    background-color: #f8f9fa;
    margin-right: auto;
    margin-left: 0;
    border: 1px solid #e9ecef;
  ` : `
    background-color: #007bff;
    color: white;
    margin-left: auto;
    margin-right: 0;
  `}
`;

const PlanOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin: 0.5rem;
  background: white;
  width: 200px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
`;

const PlanName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
`;

const PlanPrice = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
  text-align: center;
  font-size: 0.9rem;
  color: #6c757d;
`;

const PlanButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  margin-top: 1rem;

  ${props => props.primary ? `
    background-color: #007bff;
    color: white;
    &:hover {
      background-color: #0056b3;
    }
  ` : `
    background-color: #e9ecef;
    color: #495057;
    &:hover {
      background-color: #dee2e6;
    }
  `}
`;

const PlansContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
`;

const UpgradePrompt = styled.div`
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  width: 100%;
`;

const LimitMessage = styled.div`
  color: #856404;
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;

const WarningMessage = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${props => props.severe ? '#fff3cd' : '#e2e3e5'};
  border: 1px solid ${props => props.severe ? '#ffeeba' : '#d6d8db'};
  border-radius: 4px;
  color: ${props => props.severe ? '#856404' : '#383d41'};
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 1rem;

  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
`;

function Chat() {
  const { token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [remainingMessages, setRemainingMessages] = useState(MESSAGE_LIMIT);
  const [currentCount, setCurrentCount] = useState(0);
  const [timeFrame, setTimeFrame] = useState(TIME_FRAME);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    logout();
  };

  // Fetch user premium status
  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await axios.get('http://localhost:8000/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsPremium(response.data.is_premium);
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };
    fetchUserStatus();
  }, [token]);

  // Fetch chats
  useEffect(() => {
    let isMounted = true;
    const fetchChats = async () => {
      if (!token || isLoading) return;
      try {
        setIsLoading(true);
        console.log('Fetching chats...');
        const response = await axios.get('http://localhost:8000/chats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Chats response:', response.data);
        if (isMounted) {
          setChats(response.data);
          if (response.data.length === 0) {
            console.log('No chats found, creating new chat...');
            await createNewChat();
          } else {
            console.log('Setting active chat:', response.data[0].id);
            setActiveChatId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchChats();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Create new chat if none exists
  const createNewChat = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      console.log('Creating new chat...');
      const response = await axios.post('http://localhost:8000/chats', 
        { title: 'New Chat' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Create chat response:', response.data);
      
      setChats(prev => {
        // Only add the new chat if it doesn't already exist
        if (!prev.find(chat => chat.id === response.data.id)) {
          console.log('Adding new chat to list');
          return [...prev, response.data];
        }
        console.log('Chat already exists, not adding');
        return prev;
      });
      setActiveChatId(response.data.id);
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch message count
  const updateMessageCount = async () => {
    try {
      const countResponse = await axios.get('http://localhost:8000/message-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const count = countResponse.data.current_count;
      const frame = countResponse.data.time_frame;
      setCurrentCount(count);
      setTimeFrame(frame);
      setRemainingMessages(Math.max(0, MESSAGE_LIMIT - count));
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch message history
        const messagesResponse = await axios.get('http://localhost:8000/messages', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(messagesResponse.data.map(msg => ({
          content: msg.content,
          isBot: msg.is_bot
        })));

        // Get initial message count
        await updateMessageCount();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [token]);

  // Create new chat
  const handleNewChat = async () => {
    try {
      const response = await axios.post('http://localhost:8000/chats', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(prevChats => [response.data, ...prevChats]);
      setActiveChatId(response.data.id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Switch chat
  const handleChatSelect = async (chatId) => {
    setActiveChatId(chatId);
    try {
      const response = await axios.get(`http://localhost:8000/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.map(msg => ({
        content: msg.content,
        isBot: msg.is_bot
      })));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || (!isPremium && currentCount >= MESSAGE_LIMIT) || !activeChatId) {
      return;
    }

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { content: userMessage, isBot: false }]);

    try {
      const response = await axios.post(
        `http://localhost:8000/chats/${activeChatId}/messages`,
        { content: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, { content: response.data.bot_message, isBot: true }]);
      await updateMessageCount(); // Update count after successful message
    } catch (error) {
      if (error.response?.status === 402) {
        await updateMessageCount(); // Update count on error too
      } else {
        setMessages(prev => [...prev, { 
          content: "Sorry, there was an error processing your message.", 
          isBot: true 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const response = await axios.post(
        'http://localhost:8000/create-checkout-session',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Checkout response:', response.data);
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        console.error('No checkout URL in response:', response.data);
        alert('Invalid checkout response from server');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error.response?.data || error.message);
      alert(`Checkout error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleEditClick = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleTitleChange = (e) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleSubmit = async (e) => {
    e.preventDefault();
    if (!editingTitle.trim()) return;

    try {
      const response = await axios.patch(
        `http://localhost:8000/chats/${editingChatId}`,
        { title: editingTitle.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === editingChatId ? { ...chat, title: response.data.title } : chat
        )
      );
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
    setEditingChatId(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const isAtLimit = currentCount >= MESSAGE_LIMIT;

  return (
    <PageContainer>
      <Navbar>
        <NavTitle>AI Chat</NavTitle>
        <div>
          <NewChatBtn onClick={createNewChat} style={{ marginRight: '1rem' }}>
            New Chat
          </NewChatBtn>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </div>
      </Navbar>

      <MainContent>
        <ChatList>
          {chats.map(chat => (
            <ChatItem
              key={chat.id}
              active={chat.id === activeChatId}
              onClick={() => chat.id !== editingChatId && handleChatSelect(chat.id)}
            >
              {editingChatId === chat.id ? (
                <form onSubmit={handleTitleSubmit} style={{ width: '100%', display: 'flex' }}>
                  <EditInput
                    type="text"
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSubmit}
                    autoFocus
                  />
                </form>
              ) : (
                <>
                  <span>{chat.title}</span>
                  <EditButton onClick={(e) => handleEditClick(e, chat)}>
                    Edit
                  </EditButton>
                </>
              )}
            </ChatItem>
          ))}
        </ChatList>

        <ChatContainer>
          <MessagesContainer>
            {messages.map((message, index) => (
              <Message key={index} isBot={message.isBot}>
                {message.content}
              </Message>
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <InputSection>
            {!isPremium && currentCount >= MESSAGE_LIMIT - 2 && !isAtLimit && (
              <WarningContainer>
                <WarningMessage severe={currentCount >= MESSAGE_LIMIT - 1}>
                  {currentCount >= MESSAGE_LIMIT - 1 ? 
                    `Warning: You have ${MESSAGE_LIMIT - currentCount} message${MESSAGE_LIMIT - currentCount === 1 ? '' : 's'} remaining.` :
                    `Note: You have ${MESSAGE_LIMIT - currentCount} messages remaining.`
                  }
                </WarningMessage>
              </WarningContainer>
            )}
            {isAtLimit && !isPremium && (
              <WarningContainer>
                <UpgradePrompt>
                  <LimitMessage>
                    You've reached your {MESSAGE_LIMIT} message limit this {timeFrame}.
                  </LimitMessage>
                  <PlansContainer>
                    <PlanOption>
                      <PlanName>Free Plan</PlanName>
                      <PlanPrice>$0</PlanPrice>
                      <PlanFeatures>
                        <li>{MESSAGE_LIMIT} messages per {timeFrame}</li>
                        <li>Basic chat features</li>
                        <li>Multiple chat sessions</li>
                      </PlanFeatures>
                      <PlanButton onClick={() => window.location.reload()}>
                        Continue Free
                      </PlanButton>
                    </PlanOption>
                    
                    <PlanOption>
                      <PlanName>Premium</PlanName>
                      <PlanPrice>$9.99/month</PlanPrice>
                      <PlanFeatures>
                        <li>Unlimited messages</li>
                        <li>Priority support</li>
                        <li>Advanced features</li>
                      </PlanFeatures>
                      <PlanButton primary onClick={handleCheckout}>
                        Upgrade Now
                      </PlanButton>
                    </PlanOption>
                  </PlansContainer>
                </UpgradePrompt>
              </WarningContainer>
            )}
            <InputContainer onSubmit={handleSubmit}>
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isAtLimit && !isPremium}
              />
              <Button type="submit" disabled={!input.trim() || (isAtLimit && !isPremium) || isLoading}>
                Send
              </Button>
            </InputContainer>
          </InputSection>
        </ChatContainer>
      </MainContent>
    </PageContainer>
  );
}

export default Chat;
