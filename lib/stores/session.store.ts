import { create } from 'zustand';

export interface SessionMessage {
  role: 'doctor' | 'patient' | 'system' | 'ai';
  text: string;
  timestamp: number;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface SessionState {
  // Session info
  sessionId: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  status: 'idle' | 'active' | 'completed' | 'paused';

  // Messages and transcript
  messages: SessionMessage[];
  transcript: string;
  soapNote: SOAPNote | null;

  // Real-time data
  isRecording: boolean;
  duration: number;
  suggestions: string[];
  realTimeNotes: any;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  initializeSession: (
    doctorId: string,
    patientId: string,
    patientName: string
  ) => void;
  addMessage: (message: SessionMessage) => void;
  setTranscript: (transcript: string) => void;
  setSOAPNote: (soapNote: SOAPNote) => void;
  setSuggestions: (suggestions: string[]) => void;
  setRealTimeNotes: (notes: any) => void;
  startRecording: () => void;
  stopRecording: () => void;
  setStatus: (status: SessionState['status']) => void;
  setError: (error: string | null) => void;
  incrementDuration: () => void;
  resetSession: () => void;
}

const initialState = {
  sessionId: '',
  doctorId: '',
  patientId: '',
  patientName: '',
  status: 'idle' as const,
  messages: [],
  transcript: '',
  soapNote: null,
  isRecording: false,
  duration: 0,
  suggestions: [],
  realTimeNotes: null,
  isLoading: false,
  error: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  initializeSession: (doctorId, patientId, patientName) => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    set({
      sessionId,
      doctorId,
      patientId,
      patientName,
      status: 'active',
      messages: [
        {
          role: 'system',
          text: `Session started with ${patientName}`,
          timestamp: Date.now(),
        },
      ],
    });
  },

  addMessage: (message: SessionMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setTranscript: (transcript: string) => {
    set({ transcript });
  },

  setSOAPNote: (soapNote: SOAPNote) => {
    set({ soapNote });
  },

  setSuggestions: (suggestions: string[]) => {
    set({ suggestions });
  },

  setRealTimeNotes: (realTimeNotes: any) => {
    set({ realTimeNotes });
  },

  startRecording: () => {
    set({ isRecording: true, status: 'active' });
  },

  stopRecording: () => {
    set({ isRecording: false });
  },

  setStatus: (status: SessionState['status']) => {
    set({ status });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  incrementDuration: () => {
    set((state) => ({
      duration: state.duration + 1,
    }));
  },

  resetSession: () => {
    set(initialState);
  },
}));
