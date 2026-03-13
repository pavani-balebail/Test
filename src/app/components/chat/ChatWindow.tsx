// Copyright 2026 Sirsi Corporation. All rights reserved.
'use client';
import React, {useContext, useState, useRef, useEffect} from 'react';
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import {styled} from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import CloseIcon from '@mui/icons-material/Close';
import TranslationsContext from '@/app/context/TranslationsContext';
import ReactMarkdown from 'react-markdown';
import {v4 as uuidV4} from 'uuid';
import {
  MessageBubble,
  useScrollToBottom,
  parseReply,
  Message,
  ChatTranslations,
} from './chat-utils';

export type {ChatTranslations};

interface ChatWindowProps {
  proxyUrl: string;
  onClose?: () => void;
}

const ChatPaper = styled(Paper)(({theme}) => ({
  position: 'fixed',
  top: '64px',
  right: '8px',
  width: '480px',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(1.5),
  zIndex: theme.zIndex.modal + 1,
  transition: 'height 0.2s ease-in-out',
  outline: 'none',
  '&:focus-within': {
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}55`,
    borderColor: theme.palette.primary.main,
  },
  [theme.breakpoints.down('sm')]: {
    left: '8px',
    width: 'auto',
  },
}));

const ChatHeader = styled(Box)(({theme}) => ({
  padding: theme.spacing(0, 1, 0, 2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  height: 48,
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
  },
}));

const MessagesContainer = styled(Box)(({theme}) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(1.5, 1.5, 1.5, 2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
}));

const InputContainer = styled(Box)(({theme}) => ({
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const headerIconButtonStyles = {
  padding: 0,
  width: 36,
  height: 48,
  minWidth: 36,
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    display: 'block',
    fontSize: '20px',
  },
};

// Fix: Added the missing <ChatWindowProps> generic type parameter.
// The original code had `React.FC` with extra whitespace and no generic,
// which caused the props to be typed as `{}` instead of `ChatWindowProps`.
const ChatWindow: React.FC<ChatWindowProps> = ({proxyUrl, onClose}) => {
  const {getTranslations} = useContext(TranslationsContext);
  const translations = getTranslations() as ChatTranslations;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sessionId] = useState<string>(() => uuidV4());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useScrollToBottom(messagesEndRef, messages);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: uuidV4(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: unknown = await response.json();
      const replyContent = parseReply(data);

      const assistantMessage: Message = {
        id: uuidV4(),
        role: 'assistant',
        content: replyContent || (translations.errorMessage ?? 'No response received.'),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[ChatWindow] Failed to fetch reply:', err);
      const errorMessage: Message = {
        id: uuidV4(),
        role: 'assistant',
        content: translations.errorMessage ?? 'An error occurred. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimized((prev) => !prev);
  };

  return (
    <ChatPaper
      elevation={4}
      tabIndex={-1}
      style={{height: minimized ? '48px' : '600px', overflow: 'hidden'}}
    >
      <ChatHeader onClick={toggleMinimize}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {translations.title ?? 'Chat Assistant'}
        </Typography>
        <IconButton
          component="span"
          sx={headerIconButtonStyles}
          onClick={toggleMinimize}
          aria-label={minimized ? (translations.maximize ?? 'Maximize') : (translations.minimize ?? 'Minimize')}
        >
          {minimized ? <MaximizeIcon /> : <MinimizeIcon />}
        </IconButton>
        {onClose && (
          <IconButton
            component="span"
            sx={headerIconButtonStyles}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={translations.close ?? 'Close'}
          >
            <CloseIcon />
          </IconButton>
        )}
      </ChatHeader>

      {!minimized && (
        <>
          <MessagesContainer>
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <Typography variant="body2">{message.content}</Typography>
                )}
              </MessageBubble>
            ))}
            {loading && (
              <Box display="flex" justifyContent="flex-start" pl={0.5}>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          <InputContainer>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={translations.inputPlaceholder ?? 'Type a message…'}
              disabled={loading}
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      aria-label={translations.sendButton ?? 'Send'}
                      edge="end"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </InputContainer>
        </>
      )}
    </ChatPaper>
  );
};

export default ChatWindow;
