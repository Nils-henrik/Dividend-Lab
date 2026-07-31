const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]+)\)/g;

/** Strip internal markdown links (`[label](/path)`) for plain-text consumers. */
export function stripLearningRichText(text: string) {
  return text.replace(LINK_PATTERN, "$1");
}
