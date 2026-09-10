'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { http } from '@/lib/http';
import {
  type IntakeConversationDraft,
  INITIAL_DRAFT,
  DEFAULT_INITIAL_PROMPT,
} from '@/lib/voice/types';
import {
  saveActiveIntakeSession,
  loadActiveIntakeSession,
  clearActiveIntakeSession,
} from '@/lib/voice/intake-storage';

export type ConversationEntry = {
  id: string;
  role: 'assistant' | 'patient' | 'system';
  text: string;
};

export function useIntakeSession() {
  const searchParams = useSearchParams();
  const cachedSession = useRef(loadActiveIntakeSession()).current;

  const [draft, setDraft] = useState<IntakeConversationDraft>(
    cachedSession?.draft || INITIAL_DRAFT
  );
  const [assistantMessage, setAssistantMessage] = useState<string>(
    cachedSession?.assistantMessage || DEFAULT_INITIAL_PROMPT
  );
  const [history, setHistory] = useState<ConversationEntry[]>(
    cachedSession?.history && cachedSession.history.length > 0
      ? cachedSession.history
      : [{ id: 'system-1', role: 'system', text: DEFAULT_INITIAL_PROMPT }]
  );
  const [detectedLanguage, setDetectedLanguage] = useState(
    cachedSession?.detectedLanguage || 'English'
  );
  const [doctorId, setDoctorId] = useState(cachedSession?.doctorId || '');
  const [patientId, setPatientId] = useState(cachedSession?.patientId || '');
  const [isComplete, setIsComplete] = useState(false);
  const intakeIdRef = useRef<string>(cachedSession?.intakeId || '');
  const prefillDoneRef = useRef(false);

  const chatItems = useMemo(
    () => history.filter((item) => item.role !== 'system'),
    [history]
  );

  // Synchronize state changes to sessionStorage
  useEffect(() => {
    if (!isComplete) {
      saveActiveIntakeSession({
        draft,
        history,
        assistantMessage,
        intakeId: intakeIdRef.current || undefined,
        patientId,
        doctorId,
        detectedLanguage,
      });
    }
  }, [
    draft,
    history,
    assistantMessage,
    patientId,
    doctorId,
    detectedLanguage,
    isComplete,
  ]);

  // URL / LocalStorage identity hydration
  useEffect(() => {
    const qDoctorId =
      searchParams?.get('doctorId') ||
      searchParams?.get('doctorCode') ||
      (typeof window !== 'undefined'
        ? window.localStorage?.getItem('doctorId') || ''
        : '');
    const qPatientId =
      searchParams?.get('patientId') ||
      (typeof window !== 'undefined'
        ? window.localStorage?.getItem('patientId') || ''
        : '');
    const qIntakeId = searchParams?.get('intakeId') || '';

    if (qDoctorId && !doctorId) setDoctorId(qDoctorId);
    if (qPatientId && !patientId) setPatientId(qPatientId);
    if (qIntakeId && !intakeIdRef.current) intakeIdRef.current = qIntakeId;
  }, [searchParams, doctorId, patientId]);

  // Prefill existing patient information from DynamoDB
  useEffect(() => {
    let cancelled = false;

    async function fetchPrefill() {
      try {
        const queryParams = new URLSearchParams();
        if (doctorId) queryParams.set('doctorId', doctorId);
        if (patientId) queryParams.set('patientId', patientId);
        if (intakeIdRef.current)
          queryParams.set('intakeId', intakeIdRef.current);

        const data = await http.get<{
          success: boolean;
          authenticated: boolean;
          draft: IntakeConversationDraft;
          initialPrompt: string;
          patientId: string | null;
          doctorId: string | null;
          intakeId: string | null;
        }>(`/api/intakes/conversation?${queryParams.toString()}`, {
          skipAuthRedirect: true,
        });

        if (cancelled) return;

        if (data?.draft && Object.keys(data.draft).length > 0) {
          setDraft((prev) => ({ ...prev, ...data.draft }));
        }
        if (data?.intakeId) {
          intakeIdRef.current = data.intakeId;
        }
        if (data?.patientId && !patientId) {
          setPatientId(data.patientId);
        }
        if (data?.doctorId && !doctorId) {
          setDoctorId(data.doctorId);
        }

        const hasUserTurns = history.some((h) => h.role === 'patient');
        if (data?.initialPrompt && !hasUserTurns) {
          setAssistantMessage(data.initialPrompt);
          setHistory([
            { id: 'system-1', role: 'system', text: data.initialPrompt },
          ]);
        }
      } catch (err) {
        console.warn('[Voice/Prefill] Could not load prefill data:', err);
      }
    }

    if (!prefillDoneRef.current) {
      prefillDoneRef.current = true;
      void fetchPrefill();
    }

    return () => {
      cancelled = true;
    };
  }, [doctorId, patientId, history]);

  const pushHistory = useCallback(
    (role: ConversationEntry['role'], text: string) => {
      if (!text.trim()) return;
      setHistory((prev) => [
        ...prev,
        {
          id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role,
          text,
        },
      ]);
    },
    []
  );

  const resetSession = useCallback(() => {
    clearActiveIntakeSession();
    intakeIdRef.current = '';
    setDraft(INITIAL_DRAFT);
    setHistory([
      { id: 'system-1', role: 'system', text: DEFAULT_INITIAL_PROMPT },
    ]);
    setAssistantMessage(DEFAULT_INITIAL_PROMPT);
    setDetectedLanguage('English');
    setIsComplete(false);
  }, []);

  return {
    draft,
    setDraft,
    assistantMessage,
    setAssistantMessage,
    history,
    setHistory,
    detectedLanguage,
    setDetectedLanguage,
    doctorId,
    setDoctorId,
    patientId,
    setPatientId,
    isComplete,
    setIsComplete,
    intakeIdRef,
    chatItems,
    pushHistory,
    resetSession,
  };
}
