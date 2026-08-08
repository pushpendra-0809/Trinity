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
    let isMounted = true;
    if (!interviewId) return;

    async function fetchInterviewData() {
      try {
        const data = await getInterview(interviewId);
        if (isMounted) {
          setInterview(data);
          setCurrentQuestionIndex(data.currentQuestionIndex ?? 0);
          setSubmittedAnswers(data.submittedAnswers ?? {});
          setIsComplete(data.status === "completed");
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchInterviewData();

    return () => {
      isMounted = false;
    };
  }, [interviewId]);

  const currentQuestionId = currentQuestion?.id;
  const existingSavedAnswer = currentQuestionId ? submittedAnswers[currentQuestionId] : undefined;
  const [prevQuestionId, setPrevQuestionId] = useState(currentQuestionId);

  if (currentQuestionId !== prevQuestionId) {
    setPrevQuestionId(currentQuestionId);
    setAnswer(existingSavedAnswer ?? "");
  }

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
      const updated = await submitAnswer(interviewId, currentQuestion.id, answer);

      if (updated) {
        setInterview(updated);
        setSubmittedAnswers(updated.submittedAnswers ?? {});
        setCurrentQuestionIndex(updated.currentQuestionIndex ?? 0);

        if (updated.status === "completed") {
          setIsComplete(true);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [answer, currentQuestion, interviewId]);

  const handleCompleteInterview = useCallback(async () => {
    if (!interviewId) {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const data = await completeInterview(interviewId);
      if (data) {
        setInterview(data);
      }
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
