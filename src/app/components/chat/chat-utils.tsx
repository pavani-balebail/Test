// Copyright 2026 Sirsi Corporation. All rights reserved.
import {Box} from '@mui/material';
import {styled} from '@mui/material/styles';
import {useEffect, RefObject} from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatTranslations {
  title?: string;
  inputPlaceholder?: string;
  sendButton?: string;
  minimize?: string;
  maximize?: string;
  close?: string;
  errorMessage?: string;
}

export const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'role',
})<{role: 'user' | 'assistant'}>(({theme, role}) => ({
  maxWidth: '80%',
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.spacing(1.5),
  alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  backgroundColor:
    role === 'user' ? theme.palette.primary.main : theme.palette.background.paper,
  color:
    role === 'user'
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  '& p': {
    margin: 0,
  },
  '& pre': {
    overflowX: 'auto',
    maxWidth: '100%',
  },
}));

export function useScrollToBottom(
  ref: RefObject<HTMLDivElement>,
  trigger: unknown,
): void {
  useEffect(() => {
    ref.current?.scrollIntoView({behavior: 'smooth'});
  }, [ref, trigger]);
}

export function parseReply(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.reply === 'string') return obj.reply;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.text === 'string') return obj.text;
    if (Array.isArray(obj.choices) && obj.choices.length > 0) {
      const choice = obj.choices[0] as Record<string, unknown>;
      const msg = choice.message as Record<string, unknown> | undefined;
      if (msg && typeof msg.content === 'string') {
        return msg.content;
      }
    }
  }
  return '';
}
