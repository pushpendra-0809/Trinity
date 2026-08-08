import { apiRequest } from "./api";

export async function getInterviewConfiguration() {
  return apiRequest("/interviews/configuration");
}

export async function startInterview(config) {
  return apiRequest("/interviews", {
    method: "POST",
    body: config,
  });
}

export async function getInterview(interviewId) {
  return apiRequest(`/interviews/${interviewId}`);
}

export async function submitAnswer(interviewId, questionId, answer) {
  return apiRequest(`/interviews/${interviewId}/questions/${questionId}/answer`, {
    method: "POST",
    body: { answer },
  });
}

export async function completeInterview(interviewId) {
  return apiRequest(`/interviews/${interviewId}/complete`, {
    method: "POST",
  });
}

export async function getInterviewResult(interviewId) {
  return apiRequest(`/interviews/${interviewId}/result`);
}

export async function getInterviewHistory() {
  return apiRequest("/interviews/history");
}
