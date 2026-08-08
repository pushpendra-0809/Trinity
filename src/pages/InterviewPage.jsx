import { useParams } from "react-router-dom";
import InterviewInterface from "../components/InterviewInterface";

export default function InterviewPage() {
  const { id } = useParams();
  return <InterviewInterface interviewId={id} />;
}
