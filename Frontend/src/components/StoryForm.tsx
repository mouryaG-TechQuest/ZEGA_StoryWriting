import { Plus, Trash2, Upload, X, Users, BookOpen, Info, Eye, Filter, SortAsc, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight, EyeOff, Film, Edit, Copy, Clipboard, Sparkles } from 'lucide-react';
import { useState, useEffect, type ReactElement } from 'react';
import TimelineManager from './TimelineManager';
import { getAllCharacterNames, getCharacterColor } from '../utils/characterColors.tsx';
import { useAI } from '../hooks/useAI';

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  imageUrls?: string[];  // Changed from imageUrl to imageUrls array
  popularity?: number;
}

interface Genre {
  id: number;
  name: string;
  description?: string;
}

interface FormData {
  title: string;
  content: string;
  description: string;
  timelineJson: string;
  imageUrls: string[];
  characters: Character[];
  genreIds?: number[];
  isPublished?: boolean;
  writers?: string;
  showSceneTimeline?: boolean; // Option to show/hide scene timeline for readers
}

interface TimelineEntry {
  id: string;
  event: string;
  description: string;
  characters: string[];
  imageUrls: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  order: number;
}

interface StoryFormProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSubmit: (e?: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  storyId?: string;
  onCharacterCountChange?: () => void;
  genres: Genre[];
}

const StoryForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  storyId,
  onCharacterCountChange,
  genres
}: StoryFormProps) => {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'characters' | 'timeline' | 'preview'>('details');
  const [expandedCharacters, setExpandedCharacters] = useState<Set<number>>(new Set([0]));
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [characterFilter, setCharacterFilter] = useState<'none' | 'character-az' | 'actor-az'>('none');
  const [characterSearchQuery, setCharacterSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [uploadingCharacterImage, setUploadingCharacterImage] = useState<number | null>(null);
  const [characterSaveStatus, setCharacterSaveStatus] = useState<{[key: number]: {type: 'success' | 'error', message: string} | null}>({});
  const [writerMode, setWriterMode] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [castPage, setCastPage] = useState(0);
  const [customScenesPerPage, setCustomScenesPerPage] = useState(10);
  const [readerScenesPerPage, setReaderScenesPerPage] = useState(10);
  const [copiedCharacter, setCopiedCharacter] = useState<Character | null>(null);

  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showEmptySceneDialog, setShowEmptySceneDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState<React.FormEvent | null>(null);
  const { sendFeedback } = useAI();
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  
  // AI Suggestion States
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [descriptionSuggestion, setDescriptionSuggestion] = useState<string>('');
  const [showDescriptionSuggestion, setShowDescriptionSuggestion] = useState(false);
  const [characterSuggestion, setCharacterSuggestion] = useState<{field: 'name' | 'role' | 'description' | 'actorName', content: string, index: number} | null>(null);
  const [popularityAssessment, setPopularityAssessment] = useState<{index: number, assessment: string, suggestedScore?: number} | null>(null);
  const [writersSuggestion, setWritersSuggestion] = useState<string>('');

  const CAST_PER_PAGE = 20; // Paginate cast members
  const MIN_SCENES_PER_PAGE = 5;
  const MAX_SCENES_PER_PAGE = 10; // Maximum 10 scenes per page
  
  // Calculate max scenes based on screen size
  const getMaxScenesForScreen = () => {
    if (screenSize.height < 600) return 5; // Small phones
    if (screenSize.height < 800) return 7; // Medium phones/tablets
    if (screenSize.height < 1000) return 8; // Laptops
    return 10; // Large screens - max 10
  };
  
  // Get responsive text size classes
  const getTextSizeClass = () => {
    if (screenSize.width < 640) return 'text-base leading-relaxed'; // Small
    if (screenSize.width < 1024) return 'text-lg leading-relaxed'; // Medium
    return 'text-lg sm:text-xl leading-loose'; // Large
  };
  
  // Initialize timeline state BEFORE useEffects that reference it
  const [timeline, setTimeline] = useState<TimelineEntry[]>(() => {
    try {
      const parsedTimeline = formData.timelineJson ? JSON.parse(formData.timelineJson) : [];
      // Filter out empty scenes (no description AND no images) from database
      return parsedTimeline.filter((entry: TimelineEntry) => 
        entry.description.trim().length > 0 || (entry.imageUrls && entry.imageUrls.length > 0)
      );
    } catch {
      return [];
    }
  });
  
  // Update screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData, timeline]);

  // Prevent page reload/navigation without confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleAISuggestion = async (field: 'title' | 'description' | 'genre') => {
    setAiLoading(field);
    setShowTitleSuggestions(false);
    setShowDescriptionSuggestion(false);

    try {
      // Robust context generation: Handle missing/empty data gracefully
      const scenesSummary = timeline && timeline.length > 0 
        ? timeline.map(t => `Scene ${t.order}: ${t.event} - ${t.description}`).join('\n')
        : '';
        
      const charactersSummary = formData.characters && formData.characters.length > 0
        ? formData.characters.map(c => `${c.name} (${c.role}): ${c.description}`).join('\n')
        : '';

      const context = {
        story_title: formData.title || '',
        story_description: formData.description || '',
        characters: charactersSummary,
        scenes_summary: scenesSummary,
        genre: genres.filter(g => formData.genreIds?.includes(g.id)).map(g => g.name).join(', ')
      };

      // Build context string only with available data
      let contextString = `Title: ${context.story_title}\nDescription: ${context.story_description}\nGenres: ${context.genre}`;
      
      if (context.characters) {
        contextString += `\nCharacters:\n${context.characters}`;
      }
      
      if (context.scenes_summary) {
        contextString += `\nScenes:\n${context.scenes_summary}`;
      }

      let mode = 'continuation'; // Default
      let instruction = '';

      if (field === 'title') {
        mode = 'title_ideas';
        instruction = "Generate 5 creative titles.";
      } else if (field === 'description') {
        mode = 'description_autocomplete';
        instruction = "Continue the description.";
      } else if (field === 'genre') {
        mode = 'genre_selection';
        instruction = `Select from these genres: ${genres.map(g => g.name).join(', ')}`;
      }

      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: contextString,
          instruction: instruction,
          mode: mode
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.content;
        
        // Clean up potential markdown code blocks
        content = content.replace(/```json\n?|```/g, '').trim();

        if (content.startsWith('Error') || content.startsWith("I'm having trouble")) {
          console.error("AI Error:", content);
          // Show error to user (you might want to add a toast or alert here)
          alert(`AI Error: ${content}`);
          return;
        }

        if (field === 'title') {
          try {
            // Parse JSON list of titles
            const titles = JSON.parse(content);
            if (Array.isArray(titles)) {
              setTitleSuggestions(titles);
              setShowTitleSuggestions(true);
            }
          } catch (e) {
            console.error("Failed to parse title suggestions", e);
            // Fallback if it's just a string
            setTitleSuggestions([content.replace(/^["']|["']$/g, '')]);
            setShowTitleSuggestions(true);
          }
        } else if (field === 'description') {
          setDescriptionSuggestion(content);
          setShowDescriptionSuggestion(true);
        } else if (field === 'genre') {
          try {
            // Parse JSON list of genres
            const suggestedGenres: string[] = JSON.parse(content);
            if (Array.isArray(suggestedGenres)) {
              const newGenreIds = new Set(formData.genreIds || []);
              let addedCount = 0;
              
              suggestedGenres.forEach(suggestedName => {
                const genre = genres.find(g => g.name.toLowerCase() === suggestedName.toLowerCase());
                if (genre) {
                  newGenreIds.add(genre.id);
                  addedCount++;
                }
              });
              
              if (addedCount > 0) {
                setFormData({ ...formData, genreIds: Array.from(newGenreIds) });
              }
            }
          } catch (e) {
            console.error("Failed to parse genre suggestions", e);
            // Fallback for single string
            const genre = genres.find(g => g.name.toLowerCase() === content.replace(/^["']|["']$/g, '').toLowerCase());
            if (genre) {
              setFormData({ 
                ...formData, 
                genreIds: formData.genreIds?.includes(genre.id) ? formData.genreIds : [...(formData.genreIds || []), genre.id] 
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("AI Suggestion failed", error);
    } finally {
      setAiLoading(null);
    }
  };

  const handleCharacterAISuggestion = async (index: number, field: 'name' | 'role' | 'description' | 'actorName') => {
    setAiLoading(`char-${index}-${field}`);
    try {
      const char = formData.characters[index];
      const scenesSummary = timeline && timeline.length > 0 
        ? timeline.map(t => `Scene ${t.order}: ${t.event} - ${t.description}`).join('\n')
        : '';
      
      const context = {
        story_title: formData.title,
        story_description: formData.description,
        scenes_summary: scenesSummary,
        other_characters: formData.characters.filter((_, i) => i !== index).map(c => `${c.name} (${c.role})`).join(', '),
        current_char: `Name: ${char.name}, Role: ${char.role}, Description: ${char.description}, Actor: ${char.actorName || 'Not set'}`
      };

      const contextString = `Title: ${context.story_title}\nDescription: ${context.story_description}\nOther Characters: ${context.other_characters}\nCurrent Character Profile: ${context.current_char}\n\nScenes Summary:\n${context.scenes_summary}`;
      
      let instruction = '';
      if (field === 'name') instruction = "Suggest a fitting name for this character based on the story context. Return ONLY the name.";
      if (field === 'role') instruction = "Suggest a role (archetype) for this character. Return ONLY the role.";
      if (field === 'description') instruction = "Write a short, compelling description for this character. Return ONLY the description.";
      if (field === 'actorName') instruction = "Suggest a real actor name who would be perfect to play this character. Return ONLY the actor's name.";

      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: contextString,
          instruction: instruction,
          mode: 'general' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestion = data.content.trim().replace(/^["']|["']$/g, '');
        // Show suggestion with append/replace options instead of auto-applying
        setCharacterSuggestion({ field, content: suggestion, index });
      }
    } catch (error) {
      console.error("Character AI Suggestion failed", error);
    } finally {
      setAiLoading(null);
    }
  };

  const applyTitleSuggestion = (title: string) => {
    setFormData({ ...formData, title });
    setShowTitleSuggestions(false);
    // Train ZEGA with accepted title
    sendFeedback(
      `Title suggestion for: ${formData.description.slice(0, 100)}`,
      title,
      5
    );
  };

  const applyDescriptionSuggestion = (append: boolean) => {
    setFormData({
      ...formData,
      description: append 
        ? (formData.description + ' ' + descriptionSuggestion).trim()
        : descriptionSuggestion
    });
    setShowDescriptionSuggestion(false);
    // Train ZEGA with accepted description
    sendFeedback(
      `Description suggestion for: ${formData.title}`,
      descriptionSuggestion,
      5
    );
  };

  const applyCharacterSuggestion = (append: boolean) => {
    if (!characterSuggestion) return;
    const { field, content, index } = characterSuggestion;
    const char = formData.characters[index];
    
    if (append && (field === 'description' || field === 'actorName')) {
      const currentValue = char[field] || '';
      updateCharacter(index, field, (currentValue + ' ' + content).trim());
    } else {
      updateCharacter(index, field, content);
    }
    // Train ZEGA with accepted character suggestion
    sendFeedback(
      `Character ${field} suggestion for: ${char.name} (${char.role})`,
      content,
      5
    );
    setCharacterSuggestion(null);
  };

  const handlePopularityAssessment = async (index: number) => {
    setAiLoading(`char-${index}-popularity`);
    try {
      const char = formData.characters[index];
      const scenesSummary = timeline && timeline.length > 0 
        ? timeline.map(t => `Scene ${t.order}: ${t.event} - ${t.description}`).join('\n')
        : '';
      
      if (!scenesSummary) {
        setPopularityAssessment({ 
          index, 
          assessment: "Insufficient information: No scenes created yet. Please add scenes to assess character popularity."
        });
        setAiLoading(null);
        return;
      }

      const context = `Story Title: ${formData.title}\nDescription: ${formData.description}\n\nCharacter: ${char.name} (${char.role})\nDescription: ${char.description}\n\nAll Scenes:\n${scenesSummary}`;
      
      const instruction = `Analyze this character's importance and presence across all scenes. Consider:
1. How many scenes they appear in
2. Their impact on the plot
3. Character development and arc
4. Relationships with other characters
5. Screen time and dialogue presence

Provide a popularity score (1-10) and brief explanation. Format: {"score": X, "explanation": "..."}`;

      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context,
          instruction,
          mode: 'general' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.content.trim();
        
        try {
          // Try to parse JSON response
          content = content.replace(/```json\n?|```/g, '').trim();
          const parsed = JSON.parse(content);
          setPopularityAssessment({
            index,
            assessment: parsed.explanation || content,
            suggestedScore: parsed.score || undefined
          });
        } catch {
          // Fallback to plain text
          setPopularityAssessment({ index, assessment: content });
        }
      }
    } catch (error) {
      console.error("Popularity assessment failed", error);
      setPopularityAssessment({ 
        index, 
        assessment: "Assessment failed. Please try again."
      });
    } finally {
      setAiLoading(null);
    }
  };

  const applyPopularityScore = () => {
    if (!popularityAssessment || !popularityAssessment.suggestedScore) return;
    const char = formData.characters[popularityAssessment.index];
    updateCharacter(popularityAssessment.index, 'popularity', popularityAssessment.suggestedScore);
    // Train ZEGA with accepted popularity assessment
    sendFeedback(
      `Popularity assessment for: ${char.name}`,
      `Score: ${popularityAssessment.suggestedScore}, Assessment: ${popularityAssessment.assessment}`,
      5
    );
    setPopularityAssessment(null);
  };

  const handleWritersAISuggestion = async () => {
    setAiLoading('writers');
    try {
      const genreNames = formData.genreIds?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'General';
      const context = `Story Title: ${formData.title}\nDescription: ${formData.description}\nGenre: ${genreNames}`;
      const instruction = "Suggest appropriate writers or screenwriters for this type of story. Return a comma-separated list of writer names.";

      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context,
          instruction,
          mode: 'general' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestion = data.content.trim().replace(/^["']|["']$/g, '');
        setWritersSuggestion(suggestion);
      }
    } catch (error) {
      console.error("Writers AI suggestion failed", error);
    } finally {
      setAiLoading(null);
    }
  };

  const applyWritersSuggestion = (append: boolean) => {
    const current = formData.writers || '';
    const separator = current && append ? ', ' : '';
    const newWriters = append ? (current + separator + writersSuggestion).trim() : writersSuggestion;
    setFormData({
      ...formData,
      writers: newWriters
    });
    // Train ZEGA with accepted writers suggestion
    const genreNames = formData.genreIds?.map(id => genres.find(g => g.id === id)?.name).filter(Boolean).join(', ') || 'General';
    sendFeedback(
      `Writers suggestion for: ${formData.title} (${genreNames})`,
      writersSuggestion,
      5
    );
    setWritersSuggestion('');
  };

  const handleTimelineChange = (newTimeline: TimelineEntry[]) => {
    setTimeline(newTimeline);
    setFormData({ ...formData, timelineJson: JSON.stringify(newTimeline) });
    setHasUnsavedChanges(true);
  };

  const handleAddCharacterFromTimeline = async (character: Character) => {
    setFormData({
      ...formData,
      characters: [...formData.characters, character]
    });
    const newCharacters = [...formData.characters, character];

    // If editing an existing story, save the character immediately
    if (storyId) {
      try {
        const token = localStorage.getItem('token');
        const characterData = { ...character, storyId: parseInt(storyId) };
        
        const response = await fetch('http://localhost:8080/api/stories/characters', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(characterData)
        });

        if (response.ok) {
          const savedCharacter = await response.json();
          // Update the character list with the saved character (with ID)
          const finalCharacters = [...newCharacters];
          finalCharacters[finalCharacters.length - 1] = savedCharacter;
          
          const finalFormData = { ...formData, characters: finalCharacters };
          setFormData(finalFormData);
          
          // Notify parent to refresh
          if (onCharacterCountChange) {
            setTimeout(() => {
              onCharacterCountChange();
            }, 100);
          }
        }
      } catch (err) {
        console.error('Failed to save character from timeline', err);
      }
    }
  };

  const addCharacter = () => {
    const newIndex = formData.characters.length;
    setFormData({
      ...formData,
      characters: [...formData.characters, { name: '', description: '', role: '', actorName: '', popularity: 5, imageUrls: [] }]
    });
    // Collapse all existing characters and expand only the new one
    setExpandedCharacters(new Set([newIndex]));
    setShowAllCharacters(false);
  };

  const removeCharacter = (index: number) => {
    setFormData({
      ...formData,
      characters: formData.characters.filter((_: Character, i: number) => i !== index)
    });
  };

  const copyCharacter = (character: Character) => {
    setCopiedCharacter(character);
  };

  const pasteCharacter = (index: number) => {
    if (copiedCharacter) {
      const newCharacters = [...formData.characters];
      // Create a deep copy of the copied character to avoid reference issues
      // but keep a unique ID if needed, or let the backend handle it.
      // For now, we'll just copy the fields.
      newCharacters[index] = {
        ...copiedCharacter,
        // We might want to keep the original ID if we are overwriting, 
        // or maybe we want to overwrite everything. 
        // Usually paste overwrites the content.
        // If the target has an ID, we might want to preserve it if we are just updating fields,
        // but "paste" usually implies replacing the content.
        // However, if we paste into an existing slot, we probably want to keep the ID of the slot 
        // if it's an update to an existing record, OR if it's a new record, it doesn't matter.
        // Let's assume we want to copy the data (name, role, description, etc.) 
        // but maybe generate a new ID or keep the target's ID if it exists?
        // The prompt says "copy,pase option to each characters".
        // Let's just copy the properties.
        id: newCharacters[index].id, // Keep the ID of the target slot
      };
      setFormData({ ...formData, characters: newCharacters });
    }
  };

  const toggleCharacter = (index: number) => {
    const newExpanded = new Set(expandedCharacters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCharacters(newExpanded);
  };

  const getFilteredAndSortedCharacters = () => {
    let chars = formData.characters.map((char, index) => ({ char, index }));
    
    // Apply search filter
    if (characterSearchQuery.trim()) {
      const query = characterSearchQuery.toLowerCase();
      chars = chars.filter(({ char }) => 
        (char.name || '').toLowerCase().includes(query) ||
        (char.actorName || '').toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (characterFilter === 'character-az') {
      chars.sort((a, b) => (a.char.name || '').localeCompare(b.char.name || ''));
    } else if (characterFilter === 'actor-az') {
      chars.sort((a, b) => (a.char.actorName || '').localeCompare(b.char.actorName || ''));
    }
    
    return chars;
  };

  // Strongly type character updates to remove 'any'
  const updateCharacter = <K extends keyof Character>(index: number, field: K, value: Character[K]) => {
    const newCharacters = [...formData.characters];
    const oldCharacterName = newCharacters[index].name;

    newCharacters[index] = { ...newCharacters[index], [field]: value };

    // Only perform timeline rename logic when updating the 'name' field with a non-empty string
    if (
      field === 'name' &&
      oldCharacterName &&
      typeof value === 'string' &&
      value.trim() &&
      value !== oldCharacterName
    ) {
      const newName = value.trim();
      const oldNameRegex = new RegExp(`\\b${oldCharacterName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'g');
      const updatedTimeline = timeline.map(entry => {
        const renamedCharacters = entry.characters.map(c => c === oldCharacterName ? newName : c);
        return {
          ...entry,
          characters: renamedCharacters,
          description: entry.description.replace(oldNameRegex, newName),
          event: entry.event.replace(oldNameRegex, newName)
        };
      });
      setTimeline(updatedTimeline);
      setFormData({
        ...formData,
        characters: newCharacters,
        timelineJson: JSON.stringify(updatedTimeline)
      });
    } else {
      setFormData({ ...formData, characters: newCharacters });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImages(true);

    const files = Array.from(e.target.files);
    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('files', file));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stories/upload-images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const urls: string[] = await response.json();
        setFormData({ ...formData, imageUrls: [...formData.imageUrls, ...urls] });
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index)
    });
  };

  const handleCharacterImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, characterIndex: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingCharacterImage(characterIndex);

    const formDataUpload = new FormData();
    Array.from(e.target.files).forEach(file => {
      formDataUpload.append('files', file);
    });
    formDataUpload.append('type', 'character');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stories/upload-images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const urls: string[] = await response.json();
        if (urls.length > 0) {
          const newCharacters = [...formData.characters];
          const currentImages = newCharacters[characterIndex].imageUrls || [];
          newCharacters[characterIndex].imageUrls = [...currentImages, ...urls];
          setFormData({ ...formData, characters: newCharacters });
        }
      }
    } catch (err) {
      console.error('Character image upload failed', err);
    } finally {
      setUploadingCharacterImage(null);
    }
  };

  const removeCharacterImage = (characterIndex: number, imageIndex: number) => {
    const newCharacters = [...formData.characters];
    const currentImages = newCharacters[characterIndex].imageUrls || [];
    newCharacters[characterIndex].imageUrls = currentImages.filter((_, i) => i !== imageIndex);
    setFormData({ ...formData, characters: newCharacters });
  };

  const saveCharacterToGlobal = async (characterIndex: number) => {
    const character = formData.characters[characterIndex];
    if (!character.name.trim()) {
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Character name is required'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      return;
    }

    // For new stories, characters will be saved with the story
    if (!storyId) {
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'success', message: 'Character will be saved when you submit the story'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      return;
    }

    // For existing stories, save immediately
    try {
      const token = localStorage.getItem('token');
      const characterData = { ...character, storyId: parseInt(storyId) };
      
      const response = await fetch('http://localhost:8080/api/stories/characters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(characterData)
      });

      if (response.ok) {
        const savedCharacter = await response.json();
        // Update the character with the returned ID - create a completely new array
        const newCharacters = [...formData.characters];
        newCharacters[characterIndex] = savedCharacter;
        
        // Update formData with new characters array
        const updatedFormData = { ...formData, characters: newCharacters };
        setFormData(updatedFormData);
        
        setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'success', message: 'Character added successfully!'}});
        setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
        
        // Notify parent component about character count change
        if (onCharacterCountChange) {
          // Small delay to ensure state update completes
          setTimeout(() => {
            onCharacterCountChange();
          }, 100);
        }
      } else {
        setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Failed to add character'}});
        setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      }
    } catch (err) {
      console.error('Failed to save character', err);
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Failed to add character'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
    }
  };

  const updateCharacterToGlobal = async (characterIndex: number) => {
    const character = formData.characters[characterIndex];
    if (!character.id) {
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Character not saved yet. Use "Add Character" first.'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      return;
    }
    if (!character.name.trim()) {
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Character name is required'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/stories/characters/${character.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(character)
      });

      if (response.ok) {
        const updatedCharacter = await response.json();
        const newCharacters = [...formData.characters];
        newCharacters[characterIndex] = updatedCharacter;
        
        const updatedFormData = { ...formData, characters: newCharacters };
        setFormData(updatedFormData);
        
        setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'success', message: 'Character updated successfully!'}});
        setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
        
        // Notify parent component about character count change
        if (onCharacterCountChange) {
          setTimeout(() => {
            onCharacterCountChange();
          }, 100);
        }
      } else {
        setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Failed to update character'}});
        setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
      }
    } catch (err) {
      console.error('Failed to update character', err);
      setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: {type: 'error', message: 'Failed to update character'}});
      setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [characterIndex]: null}), 3000);
    }
  };



  // Validate scenes have content or images
  const validateScenes = () => {
    if (!timeline || timeline.length === 0) return [];
    
    const invalidScenes = timeline.map((entry, idx) => ({
      index: idx,
      sceneNumber: idx + 1,
      id: entry.id,
      hasContent: entry.description.trim().length > 0 || (entry.imageUrls && entry.imageUrls.length > 0)
    })).filter(scene => !scene.hasContent);
    
    return invalidScenes;
  };



  const scenesWithoutContent = validateScenes();

  // Handle navigation with confirmation
  const handleCancelWithConfirmation = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => onCancel);
      setShowLeaveConfirmation(true);
    } else {
      onCancel();
    }
  };

  const handleTabChangeWithConfirmation = (tabId: 'details' | 'characters' | 'timeline' | 'preview') => {
    // Allow free navigation between tabs without confirmation
    setActiveTab(tabId);
  };

  const confirmLeave = () => {
    setShowLeaveConfirmation(false);
    setHasUnsavedChanges(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const cancelLeave = () => {
    setShowLeaveConfirmation(false);
    setPendingNavigation(null);
  };

  // Wrap onSubmit to clear unsaved changes flag
  const handleSubmitWithValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for invalid scenes
    const invalidScenes = validateScenes();
    if (invalidScenes.length > 0) {
      // Show inline dialog instead of alert
      setPendingSubmit(e);
      setShowEmptySceneDialog(true);
      // Scroll to the validation warning
      setTimeout(() => {
        const warningElement = document.querySelector('[data-validation-warning]');
        if (warningElement) {
          warningElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }
    
    setHasUnsavedChanges(false);
    await onSubmit(e);
  };

  const handleDeleteEmptyScenesAndSubmit = async () => {
    if (!timeline) return;
    
    // Filter valid scenes immediately
    const validScenes = timeline.filter(entry => 
      entry.description.trim().length > 0 || (entry.imageUrls && entry.imageUrls.length > 0)
    );
    
    // Update both timeline and formData synchronously
    const updatedFormData = { ...formData, timelineJson: JSON.stringify(validScenes) };
    setTimeline(validScenes);
    setFormData(updatedFormData);
    setShowEmptySceneDialog(false);
    
    // Submit immediately with the updated data
    setHasUnsavedChanges(false);
    if (pendingSubmit) {
      // Call onSubmit without an event object (programmatic submission)
      await onSubmit();
      setPendingSubmit(null);
    }
  };

  const handleStayAndFixScenes = () => {
    setShowEmptySceneDialog(false);
    setPendingSubmit(null);
    // Switch to timeline tab if not already there
    if (activeTab !== 'timeline') {
      setActiveTab('timeline');
    }
  };



  const handleUpdateCharacterFromTimeline = async (updatedCharacter: Character) => {
    const index = formData.characters.findIndex(c => 
      (c.id && updatedCharacter.id && c.id === updatedCharacter.id) || 
      c.name === updatedCharacter.name
    );
    
    if (index !== -1) {
      const newCharacters = [...formData.characters];
      const oldCharacterName = newCharacters[index].name;
      newCharacters[index] = updatedCharacter;
      
      // If name changed, update timeline
      if (updatedCharacter.name !== oldCharacterName) {
        const updatedTimeline = timeline.map(entry => {
          const updatedCharacters = entry.characters.map(charName => 
            charName === oldCharacterName ? updatedCharacter.name : charName
          );
          
          const oldNameRegex = new RegExp(`\\b${oldCharacterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
          const updatedDescription = entry.description.replace(oldNameRegex, updatedCharacter.name);
          const updatedEvent = entry.event.replace(oldNameRegex, updatedCharacter.name);
          
          return {
            ...entry,
            characters: updatedCharacters,
            description: updatedDescription,
            event: updatedEvent
          };
        });
        
        setTimeline(updatedTimeline);
        setFormData({ 
          ...formData, 
          characters: newCharacters,
          timelineJson: JSON.stringify(updatedTimeline)
        });
      } else {
        setFormData({ ...formData, characters: newCharacters });
      }

      // Persist to backend if character has ID
      if (updatedCharacter.id) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:8080/api/stories/characters/${updatedCharacter.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedCharacter)
          });

          if (response.ok) {
            // Optional: Update state with response if needed, but local update is usually enough for UI responsiveness
            // const savedCharacter = await response.json();
            // console.log('Character updated in backend:', savedCharacter);
            
            // Show success feedback if needed
            setCharacterSaveStatus({...characterSaveStatus, [index]: {type: 'success', message: 'Character updated!'}});
            setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [index]: null}), 2000);
          } else {
            console.error('Failed to update character in backend');
            setCharacterSaveStatus({...characterSaveStatus, [index]: {type: 'error', message: 'Failed to save changes'}});
            setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [index]: null}), 3000);
          }
        } catch (error) {
          console.error('Error updating character:', error);
          setCharacterSaveStatus({...characterSaveStatus, [index]: {type: 'error', message: 'Network error saving changes'}});
          setTimeout(() => setCharacterSaveStatus({...characterSaveStatus, [index]: null}), 3000);
        }
      }
    }
  };

  const handleDeleteCharacterFromTimeline = (characterToDelete: Character) => {
    const index = formData.characters.findIndex(c => 
      (c.id && characterToDelete.id && c.id === characterToDelete.id) || 
      c.name === characterToDelete.name
    );
    
    if (index !== -1) {
      removeCharacter(index);
    }
  };

  const tabs = [
    { id: 'details', label: 'Story Details', icon: Info, color: 'blue', count: undefined },
    { id: 'characters', label: 'Characters', icon: Users, color: 'purple', count: formData.characters.length },
    { id: 'timeline', label: 'Write Story', icon: BookOpen, color: 'green', count: timeline.length },
    { id: 'preview', label: 'Preview Story', icon: Eye, color: 'orange', count: undefined }
  ] as const;

  return (
    <div className="bg-white rounded-xl shadow-2xl mb-6 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3" />
          <span className="truncate">{isEditing ? 'Edit Your Story' : 'Create New Story'}</span>
        </h2>
        <p className="text-purple-100 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">Craft your narrative with characters, timeline, and rich media</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colorClasses = {
              blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50',
              purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-700 hover:bg-purple-50',
              green: isActive ? 'bg-green-600 text-white' : 'text-green-700 hover:bg-green-50',
              orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-700 hover:bg-orange-50'
            };

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChangeWithConfirmation(tab.id as typeof activeTab)}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-semibold transition-all border-b-4 whitespace-nowrap text-sm sm:text-base ${
                  isActive ? 'border-current' : 'border-transparent'
                } ${colorClasses[tab.color]}`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmitWithValidation} className="p-3 sm:p-4 lg:p-6">
        {/* Story Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Story Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold mb-3 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleAISuggestion('title')}
                  disabled={!!aiLoading}
                  className="absolute right-2 top-3 text-purple-500 hover:text-purple-700 p-1 rounded-full hover:bg-purple-50 transition"
                  title="Get AI Title Suggestion"
                >
                  {aiLoading === 'title' ? (
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </button>
                
                {/* Title Suggestions Dropdown */}
                {showTitleSuggestions && titleSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border-2 border-purple-200 rounded-lg shadow-xl mt-1 p-2 animate-fadeIn">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">AI Suggestions</span>
                      <button 
                        onClick={() => setShowTitleSuggestions(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {titleSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyTitleSuggestion(suggestion)}
                          className="text-left px-4 py-2 hover:bg-purple-50 rounded-md text-sm font-medium text-gray-800 transition flex items-center group"
                        >
                          <Sparkles className="w-3 h-3 mr-2 text-purple-400 group-hover:text-purple-600" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  placeholder="Short Description (displayed in preview)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() => handleAISuggestion('description')}
                  disabled={!!aiLoading}
                  className="absolute right-2 top-3 text-purple-500 hover:text-purple-700 p-1 rounded-full hover:bg-purple-50 transition"
                  title="Get AI Description Suggestion"
                >
                  {aiLoading === 'description' ? (
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </button>

                {/* Description Suggestion Review */}
                {showDescriptionSuggestion && descriptionSuggestion && (
                  <div className="mt-2 bg-purple-50 border border-purple-200 rounded-lg p-3 animate-fadeIn">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" /> AI Suggestion
                      </span>
                      <button 
                        onClick={() => setShowDescriptionSuggestion(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 italic mb-3 bg-white p-2 rounded border border-purple-100">
                      "{descriptionSuggestion}"
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => applyDescriptionSuggestion(false)}
                        className="px-3 py-1 bg-white border border-purple-300 text-purple-700 text-xs font-semibold rounded hover:bg-purple-50 transition"
                      >
                        Replace All
                      </button>
                      <button
                        type="button"
                        onClick={() => applyDescriptionSuggestion(true)}
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition shadow-sm"
                      >
                        Append
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Writers (e.g., John Doe, Jane Smith)"
                    value={formData.writers || ''}
                    onChange={(e) => setFormData({ ...formData, writers: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleWritersAISuggestion}
                  disabled={!!aiLoading}
                  className="flex items-center gap-1 px-3 py-3 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                  title="Suggest Writers"
                >
                  {aiLoading === 'writers' ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Cover Images Section */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Cover & Story Images
              </h3>
              
              <div className="flex items-center space-x-2 mb-3">
                <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition shadow-md">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </label>
                {uploadingImages && <span className="text-sm text-blue-600 font-medium">Uploading...</span>}
              </div>

              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img 
                        src={url.startsWith('http') ? url : `http://localhost:8080${url}`} 
                        alt={`Cover image ${idx + 1}`} 
                        className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-blue-200 group-hover:border-blue-400 transition" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 sm:p-1.5 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Genres Section */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Story Genres * (Select at least one)
                </h3>
                <button
                  type="button"
                  onClick={() => handleAISuggestion('genre')}
                  disabled={!!aiLoading}
                  className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium px-2 py-1 rounded hover:bg-purple-50 transition"
                >
                  {aiLoading === 'genre' ? (
                    <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Suggest Genre
                </button>
              </div>
              
              {genres.length === 0 ? (
                <p className="text-blue-600 text-sm">Loading genres...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {genres.map((genre) => {
                    const isSelected = formData.genreIds?.includes(genre.id) || false;
                    return (
                      <label
                        key={genre.id}
                        className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                            : 'bg-white border-blue-200 text-blue-900 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentGenres = formData.genreIds || [];
                            const newGenres = e.target.checked
                              ? [...currentGenres, genre.id]
                              : currentGenres.filter((id: number) => id !== genre.id);
                            setFormData({ ...formData, genreIds: newGenres });
                          }}
                          className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">{genre.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              
              {formData.genreIds && formData.genreIds.length > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-sm font-semibold text-blue-900">
                    Selected ({formData.genreIds.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {formData.genreIds.map(genreId => {
                      const genre = genres.find(g => g.id === genreId);
                      return genre ? (
                        <span
                          key={genreId}
                          className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold"
                        >
                          {genre.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {(!formData.genreIds || formData.genreIds.length === 0) && (
                <p className="mt-2 text-red-600 text-sm font-medium">
                  ⚠️ Please select at least one genre for your story
                </p>
              )}
            </div>
          </div>
        )}

        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div className="space-y-3 sm:space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-purple-900 flex items-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Manage Characters ({formData.characters.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                  className="flex-1 sm:flex-initial bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-md transition text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {showAllCharacters ? 'Hide' : 'View All'}
                </button>
                <button
                  type="button"
                  onClick={addCharacter}
                  className="flex-1 sm:flex-initial bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center shadow-md transition text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Add Character
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            {formData.characters.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-purple-50 p-2 sm:p-3 rounded-lg">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by character or actor name..."
                    value={characterSearchQuery}
                    onChange={(e) => setCharacterSearchQuery(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-xs sm:text-sm"
                  />
                  {characterSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCharacterSearchQuery('')}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`w-full sm:w-auto p-2 rounded-lg transition flex items-center justify-center gap-2 ${
                      characterFilter !== 'none'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-700 hover:bg-purple-100 border-2 border-purple-200'
                    }`}
                    title="Sort options"
                  >
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium sm:hidden">
                      {characterFilter === 'character-az' ? 'Character A-Z' : 
                       characterFilter === 'actor-az' ? 'Actor A-Z' : 'Sort'}
                    </span>
                  </button>

                  {showFilterMenu && (
                    <div className="absolute right-0 top-12 bg-white border-2 border-purple-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <div className="p-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCharacterFilter('character-az');
                            setShowFilterMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition flex items-center ${
                            characterFilter === 'character-az'
                              ? 'bg-purple-600 text-white'
                              : 'text-purple-700 hover:bg-purple-50'
                          }`}
                        >
                          <SortAsc className="w-4 h-4 mr-2" />
                          Character Name A-Z
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCharacterFilter('actor-az');
                            setShowFilterMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition flex items-center ${
                            characterFilter === 'actor-az'
                              ? 'bg-purple-600 text-white'
                              : 'text-purple-700 hover:bg-purple-50'
                          }`}
                        >
                          <SortAsc className="w-4 h-4 mr-2" />
                          Actor Name A-Z
                        </button>
                        {characterFilter !== 'none' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCharacterFilter('none');
                              setShowFilterMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition flex items-center"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Clear Sort
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.characters.length === 0 ? (
              <div className="text-center py-12 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300">
                <Users className="w-16 h-16 text-purple-300 mx-auto mb-3" />
                <p className="text-purple-600 font-medium">No characters yet</p>
                <p className="text-purple-500 text-sm mt-1">Add characters to bring your story to life</p>
              </div>
            ) : showAllCharacters ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredAndSortedCharacters().map(({ char, index }) => (
                  <div
                    key={index}
                    onClick={() => { setShowAllCharacters(false); setExpandedCharacters(new Set([index])); }}
                    className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-purple-400 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{index + 1}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copyCharacter(char); }}
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition"
                          title="Copy Character"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {copiedCharacter && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); pasteCharacter(index); }}
                            className="text-green-500 hover:text-green-600 hover:bg-green-50 p-1 rounded transition"
                            title="Paste Character"
                          >
                            <Clipboard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeCharacter(index); }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-purple-900 text-lg truncate">
                        {char.name || 'Unnamed Character'}
                      </p>
                      {char.actorName && (
                        <p className="text-sm text-purple-700 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Actor: {char.actorName}
                        </p>
                      )}
                      {char.role && (
                        <p className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded inline-block">
                          {char.role}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {getFilteredAndSortedCharacters().map(({ char, index }) => {
                  const isExpanded = expandedCharacters.has(index);
                  return (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-center p-2 sm:p-3 cursor-pointer" onClick={() => toggleCharacter(index)}>
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="bg-purple-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap">
                          #{index + 1}
                        </span>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-semibold text-purple-900 text-sm sm:text-base truncate">{char.name || 'Unnamed Character'}</span>
                          {char.actorName && (
                            <span className="text-xs sm:text-sm text-purple-600 flex items-center truncate">
                              <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">Actor: {char.actorName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copyCharacter(char); }}
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition"
                          title="Copy Character"
                        >
                          <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {copiedCharacter && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); pasteCharacter(index); }}
                            className="text-green-500 hover:text-green-600 hover:bg-green-50 p-1 rounded transition"
                            title="Paste Character"
                          >
                            <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeCharacter(index); }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
                      </div>
                    </div>

                    <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: isExpanded ? '1000px' : '0' }}>
                      <div className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Character Name *"
                            value={char.name}
                            onChange={(e) => updateCharacter(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold text-sm sm:text-base pr-8"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleCharacterAISuggestion(index, 'name')}
                            disabled={!!aiLoading}
                            className="absolute right-2 top-2 text-purple-400 hover:text-purple-600"
                            title="Suggest Name"
                          >
                            {aiLoading === `char-${index}-name` ? (
                              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Actor Name (who plays this role)"
                            value={char.actorName || ''}
                            onChange={(e) => updateCharacter(index, 'actorName', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => handleCharacterAISuggestion(index, 'actorName')}
                            disabled={!!aiLoading}
                            className="absolute right-2 top-2 text-purple-400 hover:text-purple-600"
                            title="Suggest Actor"
                          >
                            {aiLoading === `char-${index}-actorName` ? (
                              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Role (e.g., Protagonist)"
                              value={char.role}
                              onChange={(e) => updateCharacter(index, 'role', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => handleCharacterAISuggestion(index, 'role')}
                              disabled={!!aiLoading}
                              className="absolute right-2 top-2 text-purple-400 hover:text-purple-600"
                              title="Suggest Role"
                            >
                              {aiLoading === `char-${index}-role` ? (
                                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Sparkles className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-medium text-purple-700">
                                Popularity (1-10)
                              </label>
                              <button
                                type="button"
                                onClick={() => handlePopularityAssessment(index)}
                                disabled={!!aiLoading}
                                className="text-xs flex items-center gap-1 text-purple-500 hover:text-purple-700"
                                title="AI Assess Popularity"
                              >
                                {aiLoading === `char-${index}-popularity` ? (
                                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Sparkles className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              placeholder="5"
                              value={char.popularity || ''}
                              onChange={(e) => updateCharacter(index, 'popularity', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            placeholder="Character Description"
                            value={char.description}
                            onChange={(e) => updateCharacter(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                            rows={3}
                          />
                          <button
                            type="button"
                            onClick={() => handleCharacterAISuggestion(index, 'description')}
                            disabled={!!aiLoading}
                            className="absolute right-2 top-2 text-purple-400 hover:text-purple-600"
                            title="Suggest Description"
                          >
                            {aiLoading === `char-${index}-description` ? (
                              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Character Images Upload - Support Multiple */}
                        <div className="space-y-2">
                          <label className="block text-xs sm:text-sm font-semibold text-purple-900">
                            Character Images {char.imageUrls && char.imageUrls.length > 0 && `(${char.imageUrls.length})`}
                          </label>
                          
                          {/* Display existing images */}
                          {char.imageUrls && char.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                              {char.imageUrls.map((imageUrl, imgIdx) => (
                                <div key={imgIdx} className="relative group">
                                  <img
                                    src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:8080${imageUrl}`}
                                    alt={`${char.name || 'Character'} - Image ${imgIdx + 1}`}
                                    className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-purple-300 group-hover:border-purple-500 transition"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23ddd" width="128" height="128"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeCharacterImage(index, imgIdx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Upload button */}
                          <div className="flex items-center">
                            <label className="cursor-pointer bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 sm:px-4 py-2 rounded-lg flex items-center transition text-xs sm:text-sm">
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              {uploadingCharacterImage === index ? 'Uploading...' : (char.imageUrls && char.imageUrls.length > 0 ? 'Add More Images' : 'Upload Images')}
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleCharacterImageUpload(e, index)}
                                className="hidden"
                                disabled={uploadingCharacterImage === index}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Add/Update Character Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t-2 border-purple-200">
                          {char.id ? (
                            <button
                              type="button"
                              onClick={() => updateCharacterToGlobal(index)}
                              className="flex-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-md transition text-xs sm:text-sm"
                            >
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Update Character
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => saveCharacterToGlobal(index)}
                              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center shadow-md transition"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Character
                            </button>
                          )}
                        </div>

                        {/* Inline Status Message */}
                        {characterSaveStatus[index] && (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-medium flex items-center ${
                            characterSaveStatus[index]?.type === 'success' 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {characterSaveStatus[index]?.type === 'success' ? (
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            {characterSaveStatus[index]?.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Timeline/Write Story Tab */}
        {activeTab === 'timeline' && (
          <div className="animate-fadeIn">
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg mb-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Build Your Story Timeline
              </h3>
              <p className="text-green-700 text-sm">
                Create a sequence of events with characters and images. The timeline will automatically generate your complete story. Maximum 10 scenes per page.
              </p>
            </div>

            {/* Validation Warning */}
            {scenesWithoutContent.length > 0 && (
              <div data-validation-warning className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-4 shadow-md">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Empty Scenes Detected</h4>
                    <p className="text-yellow-800 text-sm mb-2">
                      <strong>Scene {scenesWithoutContent.map(s => s.sceneNumber).join(', ')}</strong> {scenesWithoutContent.length === 1 ? 'is' : 'are'} missing content or images.
                    </p>
                    <p className="text-yellow-700 text-xs">
                      Each scene must have either a description or at least one image. When you click Update Story, you'll be asked to either delete these scenes or stay and fix them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <TimelineManager
              timeline={timeline}
              onChange={handleTimelineChange}
              availableCharacters={formData.characters}
              onAddCharacter={handleAddCharacterFromTimeline}
              onUpdateCharacter={handleUpdateCharacterFromTimeline}
              onDeleteCharacter={handleDeleteCharacterFromTimeline}
              storyTitle={formData.title}
              storyDescription={formData.description}
              storyGenre={genres.filter(g => formData.genreIds?.includes(g.id)).map(g => g.name).join(', ')}
            />
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (() => {
          const sortedTimeline = [...timeline].sort((a, b) => a.order - b.order);
          type SceneType = typeof sortedTimeline[number];
          
          // Dynamic pagination based on scene content length and screen size
          const calculateReaderPages = () => {
            const maxScenesPerPage = Math.min(readerScenesPerPage, getMaxScenesForScreen());
            const MAX_CHARS_PER_PAGE = screenSize.height < 800 ? 3000 : 4000; // Increased for more content
            const MAX_LINES_PER_PAGE = screenSize.height < 800 ? 40 : 60; // Increased for more content
            let currentPage: SceneType[] = [];
            let currentLength = 0;
            let currentLines = 0;
            const pages: SceneType[][] = [];
            
            sortedTimeline.forEach(scene => {
              const sceneLength = (scene.description || '').length;
              const sceneLines = Math.ceil(sceneLength / 80); // Approximate lines (80 chars per line)
              
              // Check if adding this scene exceeds limits OR max scenes per page
              if ((
                currentLength + sceneLength > MAX_CHARS_PER_PAGE || 
                currentLines + sceneLines > MAX_LINES_PER_PAGE ||
                currentPage.length >= maxScenesPerPage
              ) && currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [scene];
                currentLength = sceneLength;
                currentLines = sceneLines;
              } else {
                currentPage.push(scene);
                currentLength += sceneLength;
                currentLines += sceneLines;
              }
            });
            if (currentPage.length > 0) pages.push(currentPage);
            return pages.length > 0 ? pages : [sortedTimeline]; // Fallback to all scenes if no pages
          };
          
          // Dynamic pagination for reader and writer modes
          let paginatedScenes, totalPreviewPages, effectiveScenesPerPage;
          if (writerMode) {
            effectiveScenesPerPage = Math.min(customScenesPerPage, getMaxScenesForScreen());
            totalPreviewPages = Math.ceil(sortedTimeline.length / effectiveScenesPerPage);
            paginatedScenes = sortedTimeline.slice(
              previewPage * effectiveScenesPerPage,
              (previewPage + 1) * effectiveScenesPerPage
            );
          } else {
            const readerPages = calculateReaderPages();
            totalPreviewPages = readerPages.length;
            paginatedScenes = readerPages[previewPage] || [];
            effectiveScenesPerPage = paginatedScenes.length;
          }

          // Cast pagination
          const totalCastPages = Math.ceil(formData.characters.length / CAST_PER_PAGE);
          const paginatedCast = formData.characters.slice(
            castPage * CAST_PER_PAGE,
            (castPage + 1) * CAST_PER_PAGE
          );

          return (
            <div className="space-y-4 animate-fadeIn">
              {/* Preview Header with Mode Toggle */}
              <div className="bg-orange-50 border-l-4 border-orange-600 p-3 sm:p-4 rounded-r-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-orange-900 mb-1 sm:mb-2 flex items-center text-sm sm:text-base">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                      <span className="truncate">Story Preview - {writerMode ? 'Writer' : 'Reader'}</span>
                    </h3>
                    <p className="text-orange-700 text-xs sm:text-sm line-clamp-2">
                      {writerMode ? 'See characters, images, and highlighted names' : 'Clean reading experience with highlighted character names'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWriterMode(!writerMode);
                      setPreviewPage(0);
                    }}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 whitespace-nowrap flex-shrink-0 ${
                      writerMode
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    {writerMode ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Writer</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Reader</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Writer Mode: Scenes Per Page Control */}
                {writerMode && (
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    <label className="text-xs sm:text-sm font-semibold text-purple-900 whitespace-nowrap">Scenes per page:</label>
                    <div className="flex items-center justify-between xs:justify-start gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setCustomScenesPerPage(Math.max(MIN_SCENES_PER_PAGE, customScenesPerPage - 1))}
                          className="px-2 sm:px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 sm:px-3 py-1 bg-white border border-purple-300 rounded font-bold text-purple-900 min-w-[40px] text-center text-sm sm:text-base">
                          {Math.min(customScenesPerPage, getMaxScenesForScreen())}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomScenesPerPage(Math.min(MAX_SCENES_PER_PAGE, customScenesPerPage + 1))}
                          className="px-2 sm:px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-purple-600 whitespace-nowrap">(range: {MIN_SCENES_PER_PAGE}-{Math.min(MAX_SCENES_PER_PAGE, getMaxScenesForScreen())})</span>
                    </div>
                  </div>
                )}
                
                {/* Reader Mode: Scenes Per Page Control */}
                {!writerMode && (
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <label className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Scenes per page:</label>
                    <div className="flex items-center justify-between xs:justify-start gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReaderScenesPerPage(Math.max(MIN_SCENES_PER_PAGE, readerScenesPerPage - 1));
                            setPreviewPage(0);
                          }}
                          className="px-2 sm:px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 sm:px-3 py-1 bg-white border border-gray-300 rounded font-bold text-gray-900 min-w-[40px] text-center text-sm sm:text-base">
                          {Math.min(readerScenesPerPage, getMaxScenesForScreen())}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReaderScenesPerPage(Math.min(MAX_SCENES_PER_PAGE, readerScenesPerPage + 1));
                            setPreviewPage(0);
                          }}
                          className="px-2 sm:px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-600 whitespace-nowrap">(range: {MIN_SCENES_PER_PAGE}-{Math.min(MAX_SCENES_PER_PAGE, getMaxScenesForScreen())})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{formData.title || 'Untitled Story'}</h1>
                {formData.description && (
                  <p className="text-purple-100 text-base sm:text-lg">{formData.description}</p>
                )}
              </div>

              {/* Cover Images */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {formData.imageUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
                      alt={`Cover ${idx + 1}`}
                      className="w-full h-32 sm:h-48 object-cover rounded-lg shadow-md hover:shadow-xl transition cursor-pointer"
                      onClick={() => window.open(url.startsWith('http') ? url : `http://localhost:8080${url}`, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Characters List - Only in Writer Mode - Compact with Pagination */}
              {writerMode && formData.characters.length > 0 && (
                <div className="bg-purple-50 p-2 sm:p-3 rounded-lg border border-purple-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-900 flex items-center text-xs sm:text-sm">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                      Cast ({formData.characters.length})
                      {totalCastPages > 1 && (
                        <span className="ml-1 sm:ml-2 text-xs text-purple-600">
                          ({castPage + 1}/{totalCastPages})
                        </span>
                      )}
                    </h4>
                    {totalCastPages > 1 && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => setCastPage(Math.max(0, castPage - 1))}
                          disabled={castPage === 0}
                          className="p-1 rounded hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronLeft className="w-3 h-3 text-purple-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCastPage(Math.min(totalCastPages - 1, castPage + 1))}
                          disabled={castPage === totalCastPages - 1}
                          className="p-1 rounded hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronRight className="w-3 h-3 text-purple-700" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {paginatedCast.map((char, idx) => {
                      const color = getCharacterColor(char.name, getAllCharacterNames(formData.characters));
                      return (
                        <span
                          key={idx}
                          className={`${color.bg} ${color.text} px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-semibold border ${color.border} inline-flex flex-col`}
                          title={`${char.name}${char.actorName ? ` - ${char.actorName}` : ''}${char.role ? ` (${char.role})` : ''}`}
                        >
                          <span className="font-bold truncate max-w-[100px] sm:max-w-none">{char.name}</span>
                          {char.actorName && (
                            <span className="text-xs opacity-80 font-normal truncate max-w-[100px] sm:max-w-none">{char.actorName}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unified Beautiful Search & Navigation */}
              {totalPreviewPages > 1 && (
                <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 rounded-xl border-2 border-purple-200 shadow-lg">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search Bar with Autocomplete */}
                    <div className="relative">
                      <div className="flex items-center gap-2 bg-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-purple-300 shadow-md hover:border-purple-400 transition-all">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search by page #, scene #, or scene title..."
                          value={sceneSearchQuery}
                          onChange={(e) => {
                            setSceneSearchQuery(e.target.value);
                            setShowSearchSuggestions(e.target.value.trim().length > 0);
                          }}
                          onFocus={() => {
                            if (sceneSearchQuery.trim().length > 0) {
                              setShowSearchSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay to allow clicking suggestions
                            setTimeout(() => setShowSearchSuggestions(false), 200);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                             
                              const query = sceneSearchQuery.trim();
                              if (!query) return;

                              const numericValue = parseInt(query);
                              
                              // Check if it's a page number
                              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= totalPreviewPages) {
                                setPreviewPage(numericValue - 1);
                                setSceneSearchQuery('');
                                setShowSearchSuggestions(false);
                                return;
                              }
                              
                              // Check if it's a scene number
                              if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= sortedTimeline.length) {
                                const targetPage = Math.floor((numericValue - 1) / effectiveScenesPerPage);
                                setPreviewPage(targetPage);
                                setSceneSearchQuery('');
                                setShowSearchSuggestions(false);
                                return;
                              }
                              
                              // Search by scene title
                              const foundIndex = sortedTimeline.findIndex(scene => 
                                scene.event && scene.event.toLowerCase().includes(query.toLowerCase())
                              );
                              
                              if (foundIndex !== -1) {
                                const targetPage = Math.floor(foundIndex / effectiveScenesPerPage);
                                setPreviewPage(targetPage);
                                setSceneSearchQuery('');
                                setShowSearchSuggestions(false);
                              } else {
                                alert(`No page, scene, or title matching "${query}" was found.`);
                              }
                            }
                          }}
                          className="flex-1 text-xs sm:text-sm md:text-base focus:outline-none bg-transparent placeholder:text-xs sm:placeholder:text-sm"
                        />
                        {sceneSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSceneSearchQuery('');
                              setShowSearchSuggestions(false);
                            }}
                            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        )}
                      </div>

                      {/* Autocomplete Suggestions Dropdown */}
                      {showSearchSuggestions && sceneSearchQuery.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-purple-300 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                          {(() => {
                            const query = sceneSearchQuery.trim().toLowerCase();
                            const numericValue = parseInt(sceneSearchQuery.trim());
                            const suggestions: ReactElement[] = [];

                            // Page number suggestion
                            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= totalPreviewPages) {
                              suggestions.push(
                                <button
                                  key="page-suggestion"
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setPreviewPage(numericValue - 1);
                                    setSceneSearchQuery('');
                                    setShowSearchSuggestions(false);
                                  }}
                                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100"
                                >
                                  <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-semibold text-blue-900">Go to Page {numericValue}</div>
                                    <div className="text-xs text-blue-600 mt-0.5">Jump directly to this page</div>
                                  </div>
                                </button>
                              );
                            }

                            // Scene number suggestion
                            if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= sortedTimeline.length) {
                              const targetScene = sortedTimeline[numericValue - 1];
                              const targetPage = Math.floor((numericValue - 1) / effectiveScenesPerPage);
                              suggestions.push(
                                <button
                                  key="scene-number-suggestion"
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setPreviewPage(targetPage);
                                    setSceneSearchQuery('');
                                    setShowSearchSuggestions(false);
                                  }}
                                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-green-50 transition-colors text-left border-b border-gray-100"
                                >
                                  <div className="flex-shrink-0 mt-0.5 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {numericValue}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-green-900">Go to Scene {numericValue}</div>
                                    {targetScene?.event && (
                                      <div className="text-xs text-green-700 mt-0.5 line-clamp-1">{targetScene.event}</div>
                                    )}
                                    <div className="text-xs text-green-600 mt-0.5">On page {targetPage + 1}</div>
                                  </div>
                                </button>
                              );
                            }

                            // Scene title suggestions
                            const titleMatches = sortedTimeline
                              .map((scene, idx) => ({ scene, idx }))
                              .filter(({ scene }) => scene.event && scene.event.toLowerCase().includes(query))
                              .slice(0, 5);

                            titleMatches.forEach(({ scene, idx }) => {
                              const targetPage = Math.floor(idx / effectiveScenesPerPage);
                              suggestions.push(
                                <button
                                  key={`title-${idx}`}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setPreviewPage(targetPage);
                                    setSceneSearchQuery('');
                                    setShowSearchSuggestions(false);
                                  }}
                                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                                >
                                  <Eye className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-purple-900 line-clamp-1">{scene.event}</div>
                                    {scene.description && (
                                      <div className="text-xs text-purple-600 mt-1 line-clamp-2">{scene.description.substring(0, 120)}...</div>
                                    )}
                                    <div className="text-xs text-purple-500 mt-1">Scene {idx + 1} • Page {targetPage + 1}</div>
                                  </div>
                                </button>
                              );
                            });

                            return suggestions.length > 0 ? suggestions : (
                              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                No matching pages or scenes found
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Navigation Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
                      {/* Page Info */}
                      <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-lg border border-purple-200 shadow-sm">
                        <span className="text-xs sm:text-sm font-semibold text-purple-900 whitespace-nowrap">
                          Page {previewPage + 1} of {totalPreviewPages}
                        </span>
                        <span className="text-xs text-purple-600 whitespace-nowrap">
                          ({effectiveScenesPerPage} scene{effectiveScenesPerPage !== 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPage(0)}
                          disabled={previewPage === 0}
                          className="p-1.5 sm:p-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm"
                          title="First Page"
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                          disabled={previewPage === 0}
                          className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center gap-1 font-semibold text-purple-700 shadow-sm text-xs sm:text-sm"
                        >
                          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPage(Math.min(totalPreviewPages - 1, previewPage + 1))}
                          disabled={previewPage === totalPreviewPages - 1}
                          className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 hover:border-purple-400 transition-all flex items-center gap-1 font-semibold text-purple-700 shadow-sm text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewPage(totalPreviewPages - 1)}
                          disabled={previewPage === totalPreviewPages - 1}
                          className="p-1.5 sm:p-2 bg-white border-2 border-purple-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm"
                          title="Last Page"
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Story Content - Book-like Reading Experience */}
              <div className={`rounded-lg shadow-2xl overflow-hidden ${
                writerMode ? 'bg-white border-2 border-gray-200' : 'bg-amber-50 border-2 border-amber-200'
              }`}>
                {paginatedScenes.length === 0 ? (
                  <div className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No scenes yet. Go to "Write Story" tab to add timeline entries.</p>
                  </div>
                ) : (
                  <div className={`overflow-auto ${
                    writerMode ? 'p-6 sm:p-10 max-w-4xl mx-auto' : 'p-8 sm:p-12 md:p-16 max-w-5xl mx-auto'
                  }`} style={{ maxHeight: writerMode ? 'none' : '800px' }}>
                    {/* Continuous Reading Flow - Book-like Layout */}
                    <div className={writerMode ? "prose prose-lg max-w-none" : "max-w-none"}>
                      {paginatedScenes.map((entry, idx) => {
                        const actualSceneNumber = writerMode 
                          ? previewPage * effectiveScenesPerPage + idx + 1
                          : sortedTimeline.findIndex(s => s.id === entry.id) + 1;
                        const allCharNames = getAllCharacterNames(formData.characters);
                        
                        return (
                          <div key={entry.id} className={writerMode ? "mb-8 last:mb-0" : "mb-6 last:mb-0"}>
                            {/* Small Scene Header - ONLY in Writer Mode */}
                            {writerMode && (
                              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                  Scene {actualSceneNumber}: {entry.event || `Untitled`}
                                </h4>
                                
                                {/* Writer Mode: Inline Character Badges */}
                                {entry.characters.length > 0 && (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {entry.characters.map((charName: string, cIdx: number) => {
                                      const color = getCharacterColor(charName, allCharNames);
                                      return (
                                        <span
                                          key={cIdx}
                                          className={`${color.bg} ${color.text} px-2 py-0.5 rounded-full text-xs font-semibold border ${color.border}`}
                                        >
                                          {charName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Scene Description - Book Paragraph Style */}
                            <div className={writerMode 
                              ? `${getTextSizeClass()} text-gray-900 mb-6 font-serif whitespace-pre-wrap`
                              : `text-justify ${getTextSizeClass()} text-gray-800 mb-4 font-serif whitespace-pre-wrap`
                            } style={{ 
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              wordBreak: 'break-word'
                            }}>
                              {entry.description ? (
                                (() => {
                                  // Split description into paragraphs for better readability
                                  const paragraphs = entry.description.split(/\n\n+/);
                                  return paragraphs.map((paragraph: string, pIdx: number) => (
                                    <p key={pIdx} className={!writerMode && pIdx > 0 ? "indent-8 mt-4" : pIdx > 0 ? "mt-4" : writerMode ? "" : "indent-8"}>
                                      {paragraph.split(new RegExp(`\\b(${entry.characters.join('|')})\\b`, 'gi')).map((part: string, i: number) => {
                                        const isCharacter = entry.characters.some((c: string) => c.toLowerCase() === part.toLowerCase());
                                        if (isCharacter && part.trim()) {
                                          const matchedChar = entry.characters.find((c: string) => c.toLowerCase() === part.toLowerCase()) || part;
                                          const color = getCharacterColor(matchedChar, allCharNames);
                                          return (
                                            <span
                                              key={i}
                                              style={{ color: color.hex }}
                                              className="font-bold not-italic"
                                            >
                                              {part}
                                            </span>
                                          );
                                        }
                                        return <span key={i}>{part}</span>;
                                      })}
                                    </p>
                                  ));
                                })()
                              ) : (
                                <span className="text-gray-400 italic text-base">No description for this scene</span>
                              )}
                            </div>

                            {/* Scene Images - Both Modes (Book-style for reader) */}
                            {entry.imageUrls.length > 0 && (
                              <div className={writerMode 
                                ? "mb-6 pl-4 border-l-4 border-gray-200"
                                : "mb-8 flex justify-center items-center"
                              }>
                                <div className={writerMode
                                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
                                  : "grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl"
                                }>
                                  {entry.imageUrls.map((url: string, imgIdx: number) => (
                                    <div key={imgIdx} className="relative group bg-gray-100 rounded-lg overflow-hidden">
                                      <img
                                        src={url.startsWith('http') ? url : `http://localhost:8080${url}`}
                                        alt={`Scene ${actualSceneNumber} - Image ${imgIdx + 1}`}
                                        className={writerMode
                                          ? "w-full h-16 sm:h-20 object-cover rounded border border-gray-300 group-hover:border-purple-500 transition cursor-pointer shadow-sm group-hover:shadow-md"
                                          : "w-full h-48 sm:h-64 object-cover rounded-lg border-2 border-amber-300 shadow-lg group-hover:shadow-2xl transition cursor-pointer"
                                        }
                                        onClick={() => window.open(url.startsWith('http') ? url : `http://localhost:8080${url}`, '_blank')}
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E';
                                        }}
                                      />
                                      {!writerMode && (
                                        <div className="text-center mt-2 text-sm italic text-gray-600">
                                          Image {imgIdx + 1}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Pagination */}
              {totalPreviewPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setPreviewPage(0)}
                    disabled={previewPage === 0}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    First
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                    disabled={previewPage === 0}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold">
                    {previewPage + 1} / {totalPreviewPages}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewPage(Math.min(totalPreviewPages - 1, previewPage + 1))}
                    disabled={previewPage === totalPreviewPages - 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewPage(totalPreviewPages - 1)}
                    disabled={previewPage === totalPreviewPages - 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                  >
                    Last
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Form Actions */}
        <div className="space-y-4 mt-8 pt-6 border-t-2 border-gray-200">
          {/* Publish Toggle */}
          <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
            <div className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-bold text-gray-900">Publish Status</h4>
                <p className="text-sm text-gray-600">
                  {formData.isPublished ? 'Story is visible to all users' : 'Story is saved as draft'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isPublished || false}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  console.log('Publish status changed:', newValue);
                  setFormData({ ...formData, isPublished: newValue });
                  setHasUnsavedChanges(true);
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600 group-hover:shadow-lg transition-shadow"></div>
            </label>
          </div>

          {/* Scene Timeline Visibility Toggle */}
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border-2 border-purple-200">
            <div className="flex items-center space-x-3">
              <Film className="w-6 h-6 text-purple-600" />
              <div>
                <h4 className="font-bold text-gray-900">Show Scene Timeline to Readers</h4>
                <p className="text-sm text-gray-600">
                  {formData.showSceneTimeline !== false ? 'Readers can view interactive scene timeline' : 'Scene timeline hidden from readers'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.showSceneTimeline !== false}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  console.log('Show timeline toggle changed:', newValue);
                  setFormData({ ...formData, showSceneTimeline: newValue });
                  setHasUnsavedChanges(true);
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 group-hover:shadow-lg transition-shadow"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.genreIds || formData.genreIds.length === 0}
              className={`flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 sm:py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg shadow-lg ${hasUnsavedChanges ? 'ring-2 ring-yellow-400 ring-offset-2 animate-pulse' : ''}`}
              title={!formData.title.trim() ? 'Story title is required' : (!formData.genreIds || formData.genreIds.length === 0) ? 'Please select at least one genre' : hasUnsavedChanges ? 'You have unsaved changes - click to save' : ''}
            >
              {loading ? 'Saving...' : hasUnsavedChanges ? (storyId ? '💾 Save Changes' : '✨ Save Story') : (storyId ? '✅ Saved' : '✨ Create Story')}
            </button>
            <button
              type="button"
              onClick={handleCancelWithConfirmation}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-semibold text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Empty Scene Confirmation Dialog */}
      {showEmptySceneDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Info className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Empty Scenes Detected
                </h3>
                <p className="text-gray-700 mb-3">
                  <strong>{scenesWithoutContent.length}</strong> scene{scenesWithoutContent.length > 1 ? 's are' : ' is'} missing content or images:
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-900">
                    Scene {scenesWithoutContent.map(s => s.sceneNumber).join(', ')}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Each scene must have either a description or at least one image.
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  What would you like to do?
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStayAndFixScenes}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <Edit className="w-5 h-5" />
                Stay & Fix Scenes
              </button>
              <button
                onClick={handleDeleteEmptyScenesAndSubmit}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete Empty Scenes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Suggestion Modal */}
      {characterSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-purple-900 mb-3 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
              AI Suggestion - {characterSuggestion.field.charAt(0).toUpperCase() + characterSuggestion.field.slice(1)}
            </h3>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-gray-800 whitespace-pre-wrap">{characterSuggestion.content}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCharacterSuggestion(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              {(characterSuggestion.field === 'description' || characterSuggestion.field === 'actorName') && (
                <button
                  onClick={() => applyCharacterSuggestion(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Append
                </button>
              )}
              <button
                onClick={() => applyCharacterSuggestion(false)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popularity Assessment Modal */}
      {popularityAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-purple-900 mb-3 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
              Character Popularity Assessment
            </h3>
            <div className="mb-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              {popularityAssessment.suggestedScore && (
                <div className="mb-3 p-3 bg-white rounded-lg border border-purple-300">
                  <span className="text-sm font-semibold text-purple-700">Suggested Score: </span>
                  <span className="text-2xl font-bold text-purple-900">{popularityAssessment.suggestedScore}/10</span>
                </div>
              )}
              <p className="text-gray-800 whitespace-pre-wrap">{popularityAssessment.assessment}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPopularityAssessment(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
              {popularityAssessment.suggestedScore && (
                <button
                  onClick={applyPopularityScore}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Apply Score ({popularityAssessment.suggestedScore})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Writers Suggestion Modal */}
      {writersSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
              AI Suggested Writers
            </h3>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-gray-800 whitespace-pre-wrap">{writersSuggestion}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setWritersSuggestion('')}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => applyWritersSuggestion(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Append
              </button>
              <button
                onClick={() => applyWritersSuggestion(false)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <Info className="w-6 h-6 mr-2 text-yellow-500" />
              Unsaved Changes
            </h3>
            <p className="text-gray-700 mb-6">
              You have unsaved changes. Do you want to save your story before leaving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLeave}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Leave Without Saving
              </button>
              <button
                onClick={async () => {
                  setShowLeaveConfirmation(false);
                  const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                  await handleSubmitWithValidation(fakeEvent);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryForm;
