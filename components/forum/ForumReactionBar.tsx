import type { ForumReaction } from "@/types/forum";
import ForumRecognitionBar from "./ForumRecognitionBar";

type Props = {
  reactions: ForumReaction[];
};

export default function ForumReactionBar({ reactions }: Props) {
  return <ForumRecognitionBar recognitions={reactions} />;
}
