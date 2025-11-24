import type { ReactElement } from 'react';

// Generate consistent colors for characters
const CHAR_COLORS = [
  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', hex: '#ef4444' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', hex: '#3b82f6' },
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', hex: '#10b981' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hex: '#a855f7' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', hex: '#f97316' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', hex: '#ec4899' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', hex: '#eab308' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', hex: '#6366f1' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', hex: '#14b8a6' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', hex: '#06b6d4' }
];

export const getCharacterColor = (characterName: string, allCharacters: string[]) => {
  const index = allCharacters.indexOf(characterName);
  if (index === -1) {
    // Return first color as default if character not found
    return CHAR_COLORS[0];
  }
  return CHAR_COLORS[index % CHAR_COLORS.length];
};

export const getAllCharacterNames = (characters: { name: string }[]) => {
  return characters.map(c => c.name).filter(Boolean);
};

export const formatCharacterNameInText = (text: string, characterNames: string[]) => {
  if (!text || characterNames.length === 0) return text;
  
  let formattedText = text;
  characterNames.forEach(name => {
    // Match whole words only (case insensitive)
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `***${name}***`);
  });
  
  return formattedText;
};

export const renderFormattedText = (
  text: string, 
  characterNames: string[], 
  characterColors: Map<string, typeof CHAR_COLORS[0]>
) => {
  if (!text || characterNames.length === 0) return text;
  
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  
  // Create a regex that matches any character name
  const pattern = characterNames
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special chars
    .join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the colored, formatted character name
    const matchedName = match[0];
    const color = characterColors.get(matchedName.toLowerCase());
    parts.push(
      <span
        key={`${match.index}-${matchedName}`}
        className={`font-bold italic ${color?.text || 'text-gray-900'} px-1 rounded`}
        style={{ backgroundColor: color?.hex ? `${color.hex}15` : 'transparent' }}
      >
        {matchedName}
      </span>
    );
    
    lastIndex = match.index + matchedName.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
};
