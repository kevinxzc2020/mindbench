/** Original mascots grouped into four color families, four characters each. */
export const MBTI_CHARACTER_GROUPS = {
  purple: ["INTJ", "INTP", "ENTJ", "ENTP"],
  green: ["INFJ", "INFP", "ENFJ", "ENFP"],
  blue: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  yellow: ["ISTP", "ISFP", "ESTP", "ESFP"],
} as const;
export function mbtiCharacterImage(type: string) {
  return `/images/mbti-characters/${type.toLowerCase()}-v3.png`;
}
export function mbtiCharacterAccent(type: string) {
  if (type.includes("NT")) return "#b497dc";
  if (type.includes("NF")) return "#8ac78f";
  if (type[1] === "S" && type.endsWith("J")) return "#80bce8";
  return "#eccb64";
}
