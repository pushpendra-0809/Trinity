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

/**
 * Dashboard "Start New Test" flow.
 * Candidate identity is already known from AuthContext — no name form needed.
 * Creates a completely fresh interview session under the same candidate.
 */
export async function startNewInterviewForCandidate({ id, name, candidate_type, jobRole }) {
  return apiRequest("/interviews/new-for-candidate", {
    method: "POST",
    body: {
      candidate_id: id,
      candidate_name: name,
      candidate_type: candidate_type || "new",
      jobRole: jobRole || "AI Engineer",
    },
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

export async function skipQuestion(interviewId, questionId) {
  return apiRequest(`/interviews/${interviewId}/questions/${questionId}/skip`, {
    method: "POST",
  });
}

export async function completeInterview(interviewId) {
  return apiRequest(`/interviews/${interviewId}/complete`, {
    method: "POST",
  });
}

export async function terminateInterview(interviewId, reason = "VOLUNTARY_EXIT") {
  return apiRequest(`/interviews/${interviewId}/terminate`, {
    method: "POST",
    body: { reason },
  });
}

export async function getInterviewResult(interviewId) {
  return apiRequest(`/interviews/${interviewId}/result`);
}

export async function getInterviewHistory() {
  return apiRequest("/interviews/history");
}

export async function getCandidateDashboard(candidateId) {
  const query = candidateId ? `?candidate_id=${encodeURIComponent(candidateId)}` : "";
  return apiRequest(`/candidate/dashboard${query}`);
}

export async function getCandidateProfile(candidateQuery) {
  const query = candidateQuery ? `?query=${encodeURIComponent(candidateQuery)}` : "";
  return apiRequest(`/candidate/profile${query}`);
}
