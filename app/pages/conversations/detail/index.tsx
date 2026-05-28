import { useParams } from "react-router";
import { ConversationsInbox } from "../ConversationsInbox";

export function ConversationDetailPage() {
  const { threadId } = useParams<{ threadId: string }>();

  return <ConversationsInbox activeThreadId={threadId} />;
}

export default ConversationDetailPage;
