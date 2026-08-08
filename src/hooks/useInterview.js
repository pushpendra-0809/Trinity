import { useCallback, useEffect, useState } from "react";
import {
  completeInterview,
  getInterview,
  submitAnswer,
} from "../services/interviewService";

export function useInterview(interviewId) {
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  const questions = interview?.questions ?? [];
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const totalQuestions = questions.length;

  const loadInterview = useCallback(async () => {
    if (!interviewId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getInterview(interviewId);
      setInterview(data);
      setCurrentQuestionIndex(data.currentQuestionIndex ?? 0);
      setSubmittedAnswers(data.submittedAnswers ?? {});
      setIsComplete(data.status === "completed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  useEffect(() => {
    if (!currentQuestion) {
      setAnswer("");
      return;
    }

    const existingAnswer = submittedAnswers[currentQuestion.id];
    setAnswer(existingAnswer ?? "");
  }, [currentQuestion, submittedAnswers]);

  const goToQuestion = useCallback(
    (index) => {
      if (index < 0 || index >= totalQuestions) {
        return;
      }

      setCurrentQuestionIndex(index);
    },
    [totalQuestions]
  );

  const goToPrevious = useCallback(() => {
    goToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, goToQuestion]);

  const goToNext = useCallback(() => {
    goToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, goToQuestion]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!currentQuestion || !interviewId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitAnswer(interviewId, currentQuestion.id, answer);

      setSubmittedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));

      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [answer, currentQuestion, currentQuestionIndex, interviewId, totalQuestions]);

  const handleCompleteInterview = useCallback(async () => {
    if (!interviewId) {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      await completeInterview(interviewId);
      setIsComplete(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }, [interviewId]);

  return {
    interview,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    answer,
    setAnswer,
    submittedAnswers,
    loading,
    submitting,
    completing,
    error,
    isComplete,
    goToPrevious,
    goToNext,
    goToQuestion,
    handleSubmitAnswer,
    handleCompleteInterview,
    reload: loadInterview,
    setError,
  };
}
