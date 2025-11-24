import { useState, useMemo, useRef, useEffect, startTransition } from 'react';
import { Plus, Trash2, Upload, X, ChevronDown, ChevronUp, Users, Image as ImageIcon, Search, Edit2, Check, XCircle, ChevronLeft, ChevronRight, Film, Eye, EyeOff, Video, Music, Copy, Clipboard, Sparkles, Wand2 } from 'lucide-react';
import { getCharacterColor, getAllCharacterNames } from '../utils/characterColors.tsx';
import { useAI } from '../hooks/useAI';

interface Character {
  id?: string;
  name: string;
  description: string;
  role: string;
  actorName?: string;
  popularity?: number;
  imageUrls?: string[];
}

interface TimelineEntry {
  id: string;
  event: string;
  description: string;
  characters: string[]; // character names
  imageUrls: string[];
  videoUrls?: string[];
  audioUrls?: string[];
  order: number;
}

import AIAssistant from './AIAssistant';

interface TimelineManagerProps {
  timeline: TimelineEntry[];
  onChange: (timeline: TimelineEntry[]) => void;
  availableCharacters: Character[];
  onAddCharacter: (character: Character) => void;
  onUpdateCharacter?: (character: Character) => void;
  onDeleteCharacter?: (character: Character) => void;
  storyTitle?: string;
  storyDescription?: string;
  storyGenre?: string;
}

const TimelineManager = ({ timeline, onChange, availableCharacters, onAddCharacter, onUpdateCharacter, onDeleteCharacter, storyTitle = '', storyDescription = '', storyGenre = '' }: TimelineManagerProps) => {
  const { getSuggestion, generateScene, loading: aiLoading, sendFeedback } = useAI();
  const [realTimeSuggestion, setRealTimeSuggestion] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [showCharacters, setShowCharacters] = useState(false);
  const [showNewCharacterForm, setShowNewCharacterForm] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState<string | null>(null);
  const [uploadingVideos, setUploadingVideos] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSceneIndex, setActiveSceneIndex] = useState<number | null>(null);
  const [editingSceneNumber, setEditingSceneNumber] = useState<string | null>(null);
  const [newSceneNumber, setNewSceneNumber] = useState('');
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [timelineBarPage, setTimelineBarPage] = useState(0);
  const [editingTimelineSceneId, setEditingTimelineSceneId] = useState<string | null>(null);
  const [timelineSceneNumber, setTimelineSceneNumber] = useState('');
  const [quickJumpValue, setQuickJumpValue] = useState('');
  const [hiddenScenes, setHiddenScenes] = useState<Set<string>>(new Set());
  const [manuallySetActive, setManuallySetActive] = useState(false);
  const [sceneVisibilityFilter, setSceneVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentScenePage, setCurrentScenePage] = useState(0);
  const [scenesPerPageList, setScenesPerPageList] = useState(10);
  const [showPreview, setShowPreview] = useState(false);
  const [previewWriterMode, setPreviewWriterMode] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewScenesPerPage, setPreviewScenesPerPage] = useState(10);
  const [searchPageNumber, setSearchPageNumber] = useState('');
  const [searchSceneNumber, setSearchSceneNumber] = useState('');
  const MIN_PREVIEW_SCENES = 5;
  const MAX_PREVIEW_SCENES_WRITER = 20;
  const MAX_PREVIEW_SCENES_READER = 10;
  
  // Dynamic scenes per page based on screen width
  const [scenesPerPage, setScenesPerPage] = useState(10);
  
  useEffect(() => {
    const updateScenesPerPage = () => {
      const width = window.innerWidth;
      if (width < 640) setScenesPerPage(5); // mobile
      else if (width < 768) setScenesPerPage(7); // tablet
      else if (width < 1024) setScenesPerPage(8); // small desktop
      else setScenesPerPage(10); // large desktop - max 10
    };
    
    updateScenesPerPage();
    window.addEventListener('resize', updateScenesPerPage);
    return () => window.removeEventListener('resize', updateScenesPerPage);
  }, []);
  
  const SCENES_PER_PAGE = scenesPerPage;
  const timelineBarRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [newCharacter, setNewCharacter] = useState<Character>({
    name: '',
    description: '',
    role: '',
    actorName: '',
    popularity: undefined
  });
  const [copiedScene, setCopiedScene] = useState<TimelineEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [copiedCharacter, setCopiedCharacter] = useState<Character | null>(null);
  const [popularityFilter, setPopularityFilter] = useState<number>(0);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [lastFocusedSceneId, setLastFocusedSceneId] = useState<string | null>(null);
  const [aiLoadingState, setAiLoadingState] = useState<string | null>(null);

  // Get all character names for color assignment
  const allCharacterNames = useMemo(() => getAllCharacterNames(availableCharacters), [availableCharacters]);

  // Filter timeline entries based on search query
  const filteredTimeline = useMemo(() => {
    let filtered = timeline;
    
    // Apply visibility filter
    if (sceneVisibilityFilter === 'visible') {
      filtered = filtered.filter(entry => !hiddenScenes.has(entry.id));
    } else if (sceneVisibilityFilter === 'hidden') {
      filtered = filtered.filter(entry => hiddenScenes.has(entry.id));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry, index) => {
        const sceneNumber = (index + 1).toString();
        const eventTitle = entry.event.toLowerCase();
        const description = entry.description.toLowerCase();
        
        return sceneNumber.includes(query) || 
               eventTitle.includes(query) || 
               description.includes(query);
      });
    }
    
    return filtered;
  }, [timeline, searchQuery, sceneVisibilityFilter, hiddenScenes]);

  // Paginate filtered timeline
  const totalScenePages = Math.ceil(filteredTimeline.length / scenesPerPageList);
  const paginatedScenes = useMemo(() => {
    const start = currentScenePage * scenesPerPageList;
    const end = start + scenesPerPageList;
    return filteredTimeline.slice(start, end);
  }, [filteredTimeline, currentScenePage, scenesPerPageList]);

  const goToSceneListPage = (page: number) => {
    setCurrentScenePage(Math.max(0, Math.min(page, totalScenePages - 1)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to scene when clicked in timeline bar
  const scrollToScene = (entryId: string, index: number) => {
    setActiveSceneIndex(index);
    setManuallySetActive(true);
    // Navigate timeline bar to the correct page
    goToScenePage(index);
    // Scroll timeline bar to show the scene card
    setTimeout(() => {
      if (timelineBarRef.current) {
        const cardWidth = window.innerWidth < 640 ? 112 : window.innerWidth < 768 ? 144 : 176;
        const spacing = window.innerWidth < 640 ? 8 : 12;
        const indexInPage = index % SCENES_PER_PAGE;
        const scrollPosition = indexInPage * (cardWidth + spacing);
        timelineBarRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
      }
    }, 100);
    // Scroll to the scene in main content
    const element = sceneRefs.current[entryId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Expand the scene
      setExpandedEntries(new Set([entryId]));
    }
  };

  // Update active scene on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Don't auto-update if user manually selected a scene
      if (manuallySetActive) {
        // Set a timeout to reset manual flag after user stops scrolling for 2 seconds
        scrollTimeoutRef.current = setTimeout(() => {
          // Only reset if user has scrolled significantly away from the selected scene
          if (activeSceneIndex !== null) {
            const selectedElement = sceneRefs.current[timeline[activeSceneIndex]?.id];
            if (selectedElement) {
              const rect = selectedElement.getBoundingClientRect();
              // If the selected scene is far from viewport, allow auto-update
              if (Math.abs(rect.top - 200) > 500) {
                setManuallySetActive(false);
              }
            }
          }
        }, 2000);
        return;
      }
      
      let closestIndex = 0;
      let closestDistance = Infinity;
      
      timeline.forEach((entry, index) => {
        const element = sceneRefs.current[entry.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - 200); // 200px from top
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        }
      });
      
      setActiveSceneIndex(closestIndex);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [timeline, manuallySetActive, activeSceneIndex]);

  const addTimelineEntry = () => {
    const newSceneNumber = timeline.length + 1;
    const newEntry: TimelineEntry = {
      id: Date.now().toString(),
      event: `Scene ${newSceneNumber}`, // Default title with scene number
      description: '',
      characters: [],
      imageUrls: [],
      order: timeline.length
    };
    onChange([...timeline, newEntry]);
    setExpandedEntries(new Set([...expandedEntries, newEntry.id]));
  };

  const removeEntry = (id: string) => {
    onChange(timeline.filter(e => e.id !== id));
    const newExpanded = new Set(expandedEntries);
    newExpanded.delete(id);
    setExpandedEntries(newExpanded);
    
    // Clean up hidden scenes
    const newHidden = new Set(hiddenScenes);
    newHidden.delete(id);
    setHiddenScenes(newHidden);
    
    // Reset active scene if it was the deleted one
    if (timeline.findIndex(e => e.id === id) === activeSceneIndex) {
      setActiveSceneIndex(null);
      setManuallySetActive(false);
    }
  };

  const updateEntry = (id: string, field: keyof TimelineEntry, value: string | string[] | number) => {
    // Batch update to prevent forced reflows
    const updatedTimeline = timeline.map(e => e.id === id ? { ...e, [field]: value } : e);
    onChange(updatedTimeline);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  const collapseAll = () => {
    setExpandedEntries(new Set());
  };

  const expandAll = () => {
    setExpandedEntries(new Set(filteredTimeline.map(entry => entry.id)));
  };

  const moveEntry = (id: string, direction: 'up' | 'down') => {
    const index = timeline.findIndex(e => e.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === timeline.length - 1)) return;
    
    const newTimeline = [...timeline];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newTimeline[index], newTimeline[targetIndex]] = [newTimeline[targetIndex], newTimeline[index]];
    
    onChange(newTimeline.map((e, i) => ({ ...e, order: i })));
  };

  const startEditSceneNumber = (entryId: string, currentIndex: number) => {
    setEditingSceneNumber(entryId);
    setNewSceneNumber((currentIndex + 1).toString());
  };

  const cancelEditSceneNumber = () => {
    setEditingSceneNumber(null);
    setNewSceneNumber('');
  };

  const confirmSceneNumberChange = (_entryId: string, currentIndex: number) => {
    const targetSceneNumber = parseInt(newSceneNumber);
    
    if (isNaN(targetSceneNumber) || targetSceneNumber < 1 || targetSceneNumber > timeline.length) {
      showToast(`Please enter a valid scene number between 1 and ${timeline.length}`, 'error');
      return;
    }

    const targetIndex = targetSceneNumber - 1;
    
    if (targetIndex === currentIndex) {
      cancelEditSceneNumber();
      return;
    }

    // Reorder the timeline
    const newTimeline = [...timeline];
    const [movedEntry] = newTimeline.splice(currentIndex, 1);
    newTimeline.splice(targetIndex, 0, movedEntry);
    
    // Update order property
    onChange(newTimeline.map((e, i) => ({ ...e, order: i })));
    cancelEditSceneNumber();
  };

  // Drag and Drop handlers for timeline bar
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSceneIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedSceneIndex === null || draggedSceneIndex === dropIndex) {
      setDraggedSceneIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTimeline = [...timeline];
    const [draggedEntry] = newTimeline.splice(draggedSceneIndex, 1);
    newTimeline.splice(dropIndex, 0, draggedEntry);
    
    onChange(newTimeline.map((e, i) => ({ ...e, order: i })));
    
    setDraggedSceneIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSceneIndex(null);
    setDragOverIndex(null);
  };

  // Timeline bar scene number editing
  const startEditTimelineScene = (entryId: string, currentIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTimelineSceneId(entryId);
    setTimelineSceneNumber((currentIndex + 1).toString());
  };

  const confirmTimelineSceneChange = (currentIndex: number) => {
    const targetSceneNumber = parseInt(timelineSceneNumber);
    
    if (isNaN(targetSceneNumber) || targetSceneNumber < 1 || targetSceneNumber > timeline.length) {
      showToast(`Please enter a valid scene number between 1 and ${timeline.length}`, 'error');
      return;
    }

    const targetIndex = targetSceneNumber - 1;
    
    if (targetIndex !== currentIndex) {
      const newTimeline = [...timeline];
      const [movedEntry] = newTimeline.splice(currentIndex, 1);
      newTimeline.splice(targetIndex, 0, movedEntry);
      onChange(newTimeline.map((e, i) => ({ ...e, order: i })));
    }
    
    setEditingTimelineSceneId(null);
    setTimelineSceneNumber('');
  };

  const cancelTimelineSceneEdit = () => {
    setEditingTimelineSceneId(null);
    setTimelineSceneNumber('');
  };

  // Pagination for timeline bar
  const totalPages = Math.ceil(timeline.length / SCENES_PER_PAGE);
  const paginatedTimeline = timeline.slice(
    timelineBarPage * SCENES_PER_PAGE,
    (timelineBarPage + 1) * SCENES_PER_PAGE
  );

  const goToTimelinePage = (page: number) => {
    setTimelineBarPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const goToScenePage = (sceneIndex: number) => {
    const page = Math.floor(sceneIndex / SCENES_PER_PAGE);
    setTimelineBarPage(page);
  };

  const handleQuickJump = () => {
    const sceneNum = parseInt(quickJumpValue);
    if (sceneNum >= 1 && sceneNum <= timeline.length) {
      const sceneIndex = sceneNum - 1;
      // Navigate to the page in timeline bar
      goToScenePage(sceneIndex);
      // Set as active scene to highlight it
      setActiveSceneIndex(sceneIndex);
      setManuallySetActive(true);
      // Scroll the timeline bar to show the scene card
      setTimeout(() => {
        if (timelineBarRef.current) {
          const cardWidth = window.innerWidth < 640 ? 112 : window.innerWidth < 768 ? 144 : 176; // w-28/w-36/w-44
          const spacing = window.innerWidth < 640 ? 8 : 12; // space-x-2/space-x-3
          const indexInPage = sceneIndex % SCENES_PER_PAGE;
          const scrollPosition = indexInPage * (cardWidth + spacing);
          timelineBarRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
        }
      }, 100);
      setQuickJumpValue('');
    }
  };

  const deleteSceneFromTimeline = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation(entryId);
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    
    const entryId = deleteConfirmation;
    
    // Remove from timeline
    const newTimeline = timeline.filter(entry => entry.id !== entryId);
    // Update order
    const reorderedTimeline = newTimeline.map((entry, index) => ({ ...entry, order: index }));
    onChange(reorderedTimeline);
    
    // Clean up related states
    const newExpanded = new Set(expandedEntries);
    newExpanded.delete(entryId);
    setExpandedEntries(newExpanded);
    
    const newHidden = new Set(hiddenScenes);
    newHidden.delete(entryId);
    setHiddenScenes(newHidden);
    
    // Reset active scene if it was the deleted one
    if (timeline.findIndex(e => e.id === entryId) === activeSceneIndex) {
      setActiveSceneIndex(null);
      setManuallySetActive(false);
    }
    
    setDeleteConfirmation(null);
    showToast('Scene deleted successfully');
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const toggleHideScene = (entryId: string, e: React.MouseEvent | MouseEvent) => {
    if ('stopPropagation' in e) {
      e.stopPropagation();
    }
    const newHidden = new Set(hiddenScenes);
    if (newHidden.has(entryId)) {
      newHidden.delete(entryId);
    } else {
      newHidden.add(entryId);
    }
    setHiddenScenes(newHidden);
  };

  const handleImageUpload = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImages(entryId);

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
        const entry = timeline.find(e => e.id === entryId);
        if (entry) {
          updateEntry(entryId, 'imageUrls', [...entry.imageUrls, ...urls]);
        }
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImages(null);
    }
  };

  const handleVideoUpload = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingVideos(entryId);

    const files = Array.from(e.target.files);
    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('files', file));
    formDataUpload.append('type', 'video');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stories/upload-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const urls: string[] = await response.json();
        const entry = timeline.find(e => e.id === entryId);
        if (entry) {
          updateEntry(entryId, 'videoUrls', [...(entry.videoUrls || []), ...urls]);
        }
      }
    } catch (err) {
      console.error('Video upload failed', err);
    } finally {
      setUploadingVideos(null);
    }
  };

  const handleAudioUpload = async (entryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingAudio(entryId);

    const files = Array.from(e.target.files);
    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('files', file));
    formDataUpload.append('type', 'audio');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/stories/upload-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const urls: string[] = await response.json();
        const entry = timeline.find(e => e.id === entryId);
        if (entry) {
          updateEntry(entryId, 'audioUrls', [...(entry.audioUrls || []), ...urls]);
        }
      }
    } catch (err) {
      console.error('Audio upload failed', err);
    } finally {
      setUploadingAudio(null);
    }
  };

  const removeImage = (entryId: string, imageIndex: number) => {
    const entry = timeline.find(e => e.id === entryId);
    if (entry) {
      updateEntry(entryId, 'imageUrls', entry.imageUrls.filter((_, i) => i !== imageIndex));
    }
  };

  const removeVideo = (entryId: string, videoIndex: number) => {
    const entry = timeline.find(e => e.id === entryId);
    if (entry && entry.videoUrls) {
      updateEntry(entryId, 'videoUrls', entry.videoUrls.filter((_, i) => i !== videoIndex));
    }
  };

  const removeAudio = (entryId: string, audioIndex: number) => {
    const entry = timeline.find(e => e.id === entryId);
    if (entry && entry.audioUrls) {
      updateEntry(entryId, 'audioUrls', entry.audioUrls.filter((_, i) => i !== audioIndex));
    }
  };

  const toggleCharacter = (entryId: string, characterName: string) => {
    const entry = timeline.find(e => e.id === entryId);
    if (!entry) return;

    if (entry.characters.includes(characterName)) {
      updateEntry(entryId, 'characters', entry.characters.filter(c => c !== characterName));
    } else {
      updateEntry(entryId, 'characters', [...entry.characters, characterName]);
    }
  };

  const handleAddNewCharacter = (entryId: string) => {
    if (newCharacter.name.trim()) {
      onAddCharacter(newCharacter);
      toggleCharacter(entryId, newCharacter.name);
      setNewCharacter({ name: '', description: '', role: '', actorName: '', popularity: undefined });
      setShowNewCharacterForm(null);
    }
  };

  const copyScene = (entry: TimelineEntry) => {
    setCopiedScene(entry);
    showToast('Scene copied to clipboard!');
  };

  const pasteScene = () => {
    if (!copiedScene) return;
    
    const newEntry: TimelineEntry = {
      ...copiedScene,
      id: Date.now().toString(),
      event: `${copiedScene.event} (Copy)`,
      order: timeline.length
    };
    
    onChange([...timeline, newEntry]);
    setExpandedEntries(new Set([...expandedEntries, newEntry.id]));
    showToast('Scene pasted successfully!');
  };

  const duplicateCharacter = (char: Character) => {
    const newChar: Character = {
      ...char,
      name: `${char.name} (Copy)`,
      id: undefined
    };
    onAddCharacter(newChar);
    showToast(`Character "${char.name}" duplicated!`);
  };

  const copyCharacter = (char: Character) => {
    setCopiedCharacter(char);
    showToast(`Character "${char.name}" copied to clipboard!`);
  };

  const pasteCharacter = () => {
    if (!copiedCharacter) return;
    const newChar: Character = {
      ...copiedCharacter,
      name: `${copiedCharacter.name} (Copy)`,
      id: undefined
    };
    onAddCharacter(newChar);
    showToast(`Character "${newChar.name}" pasted!`);
  };

  const generateStoryFromTimeline = () => {
    return timeline
      .sort((a, b) => a.order - b.order)
      .filter(entry => !hiddenScenes.has(entry.id)) // Exclude hidden scenes
      .map((entry, idx) => {
        const castList = entry.characters.length > 0 
          ? `\n[Cast: ${entry.characters.map(name => `***${name}***`).join(', ')}]` 
          : '';
        
        // Format character names in description as bold italic
        let description = entry.description;
        entry.characters.forEach(charName => {
          const regex = new RegExp(`\\b${charName}\\b`, 'gi');
          description = description.replace(regex, `***${charName}***`);
        });
        
        return `**${idx + 1}. ${entry.event || `Scene ${idx + 1}`}**${castList}\n${description}`;
      })
      .join('\n\n');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const activeEntry = timeline.find(e => e.id === lastFocusedSceneId);
  const activeEntryIndex = timeline.findIndex(e => e.id === lastFocusedSceneId);
  const previousEntry = activeEntryIndex > 0 ? timeline[activeEntryIndex - 1] : null;

  // Calculate summaries of all previous scenes for context
  const allPreviousScenesSummary = useMemo(() => {
    if (activeEntryIndex <= 0) return [];
    return timeline
      .slice(0, activeEntryIndex)
      .map(entry => entry.description || entry.event)
      .filter(text => text.length > 0);
  }, [timeline, activeEntryIndex]);

  const aiContext = {
    story_title: storyTitle,
    story_description: storyDescription,
    genre: storyGenre,
    current_scene_text: activeEntry?.description || '',
    previous_scene_text: previousEntry?.description,
    all_previous_scenes_summary: allPreviousScenesSummary,
    characters: activeEntry ? availableCharacters.filter(c => activeEntry.characters.includes(c.name)) : []
  };

  const handleAISuggestion = (text: string) => {
    if (activeEntry) {
      const entryId = activeEntry.id;
      const newText = activeEntry.description + (activeEntry.description ? ' ' : '') + text;
      
      // Auto-detect and select existing characters mentioned in the continuation
      const mentionedChars: string[] = [];
      availableCharacters.forEach(char => {
        // Create regex that matches whole word boundaries
        const nameRegex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
        if (nameRegex.test(text)) {
          mentionedChars.push(char.name);
        }
      });
      
      // Get current characters and add detected ones
      const entry = timeline.find(e => e.id === entryId);
      if (entry) {
        const currentCharacters = [...entry.characters];
        
        mentionedChars.forEach(charName => {
          if (!currentCharacters.includes(charName)) {
            currentCharacters.push(charName);
          }
        });
        
        // Update description and characters together with proper delay
        setTimeout(() => {
          startTransition(() => {
            updateEntry(entryId, 'description', newText);
          });
          if (mentionedChars.length > 0) {
            setTimeout(() => {
              startTransition(() => {
                updateEntry(entryId, 'characters', currentCharacters);
                showToast(`Auto-selected: ${mentionedChars.join(', ')}`, 'success');
              });
            }, 150);
          }
        }, 50);
      }
      
      // Send feedback to ZEGA for learning
      sendFeedback(
        `Continue scene: ${activeEntry.description.slice(-100)}`,
        text,
        5 // Implicit positive feedback for accepted suggestion
      );
    }
  };

  const handleAISceneGeneration = (text: string, newCharacters?: Character[]) => {
    if (activeEntry) {
       const entryId = activeEntry.id;
       
       // Collect all characters to select
       const allCharactersToSelect: string[] = [];
       const mentionedExistingChars: string[] = [];
       const addedNewChars: string[] = [];
       
       // Step 1: Auto-detect ALL existing characters in the text (comprehensive search)
       availableCharacters.forEach(char => {
         // Match full name, first name, or character role mentions
         const fullNameRegex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
         const firstNameRegex = char.name.includes(' ') 
           ? new RegExp(`\\b${char.name.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
           : null;
         const roleRegex = char.role 
           ? new RegExp(`\\b${char.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
           : null;
         
         const foundInText = fullNameRegex.test(text) || 
                            (firstNameRegex && firstNameRegex.test(text)) ||
                            (roleRegex && roleRegex.test(text));
         
         if (foundInText) {
           allCharactersToSelect.push(char.name);
           mentionedExistingChars.push(char.name);
         }
       });
       
       // Step 2: Add new characters from AI
       if (newCharacters && newCharacters.length > 0) {
         newCharacters.forEach(char => {
           // Check if character already exists by name (case-insensitive)
           const exists = availableCharacters.some(c => 
             c.name.toLowerCase().trim() === char.name.toLowerCase().trim()
           );
           
           if (!exists) {
             // Create full character object with all required fields
             const newChar: Character = {
               name: char.name,
               role: char.role || 'Supporting',
               description: char.description || '',
               actorName: '',
               popularity: 5,
               imageUrls: []
             };
             onAddCharacter(newChar);
             addedNewChars.push(char.name);
           }
           
           // Add to selection list (whether new or already existed)
           if (!allCharactersToSelect.includes(char.name)) {
             allCharactersToSelect.push(char.name);
           }
         });
       }
       
       // Step 3: Update description first, then apply character selections
       setTimeout(() => {
         startTransition(() => {
           updateEntry(entryId, 'description', text);
         });
         
         if (allCharactersToSelect.length > 0) {
           setTimeout(() => {
             const entry = timeline.find(e => e.id === entryId);
             if (entry) {
               // Get current selected characters
               const currentCharacters = [...entry.characters];
               
               // Add all detected characters that aren't already selected
               allCharactersToSelect.forEach(charName => {
                 if (!currentCharacters.includes(charName)) {
                   currentCharacters.push(charName);
                 }
               });
               
               // Update entry with all characters at once
               startTransition(() => {
                 updateEntry(entryId, 'characters', currentCharacters);
               });
               
               // Show toast notifications
               if (mentionedExistingChars.length > 0) {
                 showToast(`Auto-selected existing: ${mentionedExistingChars.join(', ')}`, 'success');
               }
               if (addedNewChars.length > 0) {
                 showToast(`Added new characters: ${addedNewChars.join(', ')}`, 'success');
               }
             }
           }, 200);
         }
       }, 50);
       
       // Send feedback to ZEGA for learning
       sendFeedback(
         `Generate scene with instruction`,
         text,
         5 // Implicit positive feedback for accepted generation
       );
    } else {
       showToast('Please click inside a scene description box first', 'info');
    }
  };

  const handleDescriptionChange = (entryId: string, text: string) => {
    updateEntry(entryId, 'description', text);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only suggest if text is long enough
    if (text.trim().length > 20) {
      setIsTyping(true);
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          // Create a context with the current text
          const currentContext = {
            ...aiContext,
            current_scene_text: text
          };
          
          const suggestion = await getSuggestion(currentContext);
          if (suggestion) {
            setRealTimeSuggestion(suggestion);
          }
        } catch (error) {
          console.error("Error getting suggestion:", error);
        } finally {
          setIsTyping(false);
        }
      }, 1500); // Debounce for 1.5 seconds
    } else {
      setIsTyping(false);
      setRealTimeSuggestion(null);
    }
  };

  const acceptSuggestion = (entryId: string) => {
    if (realTimeSuggestion && activeEntry) {
      const currentText = activeEntry.description;
      // Append suggestion
      const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + realTimeSuggestion;
      
      // Auto-detect characters in real-time suggestion
      const detectedChars: string[] = [];
      availableCharacters.forEach(char => {
        const nameRegex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
        if (nameRegex.test(realTimeSuggestion)) {
          detectedChars.push(char.name);
        }
      });
      
      // Get current characters
      const entry = timeline.find(e => e.id === entryId);
      if (entry) {
        const currentCharacters = [...entry.characters];
        detectedChars.forEach(charName => {
          if (!currentCharacters.includes(charName)) {
            currentCharacters.push(charName);
          }
        });
        
        // Update description first, then characters with proper delays
        setTimeout(() => {
          startTransition(() => {
            updateEntry(entryId, 'description', newText);
          });
          if (detectedChars.length > 0) {
            setTimeout(() => {
              startTransition(() => {
                updateEntry(entryId, 'characters', currentCharacters);
              });
            }, 150);
          }
        }, 50);
      }
      
      // Train ZEGA with accepted real-time suggestion
      sendFeedback(
        `Real-time suggestion for: ${currentText.slice(-50)}`,
        realTimeSuggestion,
        5
      );
      
      setRealTimeSuggestion(null);
    }
  };

  const handleGenerateNewScene = async () => {
    try {
      showToast('Generating new scene with AI...', 'info');
      
      // Create a full context for generation including all scenes and characters
      const fullContext = {
        story_title: storyTitle,
        story_description: storyDescription,
        genre: storyGenre,
        current_scene_text: '', // We are generating a new scene
        previous_scene_text: timeline.length > 0 ? timeline[timeline.length - 1].description : '',
        all_previous_scenes_summary: timeline.map(e => e.description || e.event).filter(t => t.length > 0),
        characters: availableCharacters // Pass ALL characters so AI knows who exists
      };

      const response = await generateScene(fullContext, "Create a new scene that fits the story flow. Include a title and any new characters if needed. If you introduce a new character, provide their full details.", true);
      
      if (response) {
        const { title, content, new_characters } = response;
        
        // Add new characters if any
        if (new_characters && new_characters.length > 0) {
          new_characters.forEach(char => {
             if (!availableCharacters.some(c => c.name === char.name)) {
               onAddCharacter(char);
               showToast(`New character "${char.name}" added!`);
             }
          });
        }

        // Create new scene entry
        const newEntry: TimelineEntry = {
          id: Date.now().toString(),
          event: title || `Scene ${timeline.length + 1}`,
          description: content || '',
          characters: new_characters ? new_characters.map(c => c.name) : [],
          order: timeline.length,
          imageUrls: [],
          videoUrls: [],
          audioUrls: []
        };

        onChange([...timeline, newEntry]);
        setExpandedEntries(new Set([...expandedEntries, newEntry.id]));
        showToast('New scene generated successfully!');
        
        // Scroll to new scene
        setTimeout(() => {
           const element = sceneRefs.current[newEntry.id];
           if (element) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
        }, 100);
      }
    } catch (error) {
      console.error("Generation error:", error);
      showToast('Failed to generate scene. Please try again.', 'error');
    }
  };

  const handleAISceneTitleSuggestion = async (entryId: string) => {
    const entry = timeline.find(e => e.id === entryId);
    if (!entry) return;

    try {
      showToast('Generating title...', 'info');
      const context = {
        story_title: storyTitle,
        story_description: storyDescription,
        current_scene_text: entry.description,
        characters: availableCharacters.filter(c => entry.characters.includes(c.name)),
        genre: storyGenre
      };
      
      // Use generateScene but with a specific instruction for title only
      // We can reuse the predict endpoint directly for simpler tasks
      const response = await fetch('http://localhost:8002/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: 'user_1',
          context: `Story: ${context.story_title}\nScene Description: ${context.current_scene_text}`,
          instruction: "Generate a short, catchy title for this scene. Return ONLY the title.",
          mode: 'scene'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let title = data.content.trim();
        title = title.replace(/^["']|["']$/g, ''); // Remove quotes
        updateEntry(entryId, 'event', title);
        showToast('Title updated!');
      }
    } catch (error) {
      console.error("Title generation failed", error);
      showToast('Failed to generate title', 'error');
    }
  };

  const handleCharacterAISuggestion = async (target: 'new' | 'edit', field: 'name' | 'role' | 'description') => {
    const char = target === 'new' ? newCharacter : editingCharacter;
    if (!char) return;

    setAiLoadingState(`${target}-${field}`);
    try {
      const context = {
        story_title: storyTitle,
        story_description: storyDescription,
        other_characters: availableCharacters.filter(c => c.name !== char.name).map(c => `${c.name} (${c.role})`).join(', '),
        current_char: `Name: ${char.name}, Role: ${char.role}, Description: ${char.description}`
      };

      const contextString = `Title: ${context.story_title}\nDescription: ${context.story_description}\nOther Characters: ${context.other_characters}\nCurrent Character Profile: ${context.current_char}`;
      
      let instruction = '';
      if (field === 'name') instruction = "Suggest a fitting name for this character based on the story context. Return ONLY the name.";
      if (field === 'role') instruction = "Suggest a role (archetype) for this character. Return ONLY the role.";
      if (field === 'description') instruction = "Write a short, compelling description for this character. Return ONLY the description.";

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
        
        if (target === 'new') {
            setNewCharacter(prev => ({ ...prev, [field]: suggestion }));
        } else {
            setEditingCharacter(prev => prev ? ({ ...prev, [field]: suggestion }) : null);
        }
      }
    } catch (error) {
      console.error("Character AI Suggestion failed", error);
      showToast("AI Suggestion failed", "error");
    } finally {
      setAiLoadingState(null);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Enhanced Timeline Bar */}
      {timeline.length > 0 && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg sm:shadow-2xl p-2 sm:p-4 mb-3 sm:mb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 px-2">
            <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1.5 sm:p-2">
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-lg">Scene Timeline</h3>
                <p className="text-purple-100 text-xs hidden sm:block">{timeline.length} scenes total</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              {copiedScene && (
                <button
                  type="button"
                  onClick={pasteScene}
                  className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 border border-white/30"
                  title="Paste copied scene"
                >
                  <Clipboard className="w-3 h-3" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              )}
              {activeSceneIndex !== null && (
                <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {activeSceneIndex + 1}/{timeline.length}
                  </span>
                </div>
              )}
              {totalPages > 1 && (
                <div className="bg-white/20 backdrop-blur-sm px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg flex items-center space-x-0.5 sm:space-x-1">
                  <button
                    type="button"
                    onClick={() => goToTimelinePage(timelineBarPage - 1)}
                    disabled={timelineBarPage === 0}
                    className="text-white disabled:text-gray-300 hover:bg-white/20 p-0.5 sm:p-1 rounded transition"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-white text-xs px-1 sm:px-2">
                    {timelineBarPage + 1}/{totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToTimelinePage(timelineBarPage + 1)}
                    disabled={timelineBarPage === totalPages - 1}
                    className="text-white disabled:text-gray-300 hover:bg-white/20 p-0.5 sm:p-1 rounded transition"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Scrollable Timeline Bar */}
          <div 
            ref={timelineBarRef}
            className="relative overflow-x-auto pb-2 sm:pb-3 pt-4 sm:pt-5 px-4 sm:px-5 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10 rounded-lg"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex space-x-2 sm:space-x-3 min-w-max">
              {paginatedTimeline.map((entry, paginatedIndex) => {
                const actualIndex = timelineBarPage * SCENES_PER_PAGE + paginatedIndex;
                const isHidden = hiddenScenes.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, actualIndex)}
                    onDragOver={(e) => handleDragOver(e, actualIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, actualIndex)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex-shrink-0 w-28 sm:w-36 md:w-44 rounded-lg sm:rounded-xl transition-all duration-300 cursor-move group ${
                      draggedSceneIndex === actualIndex
                        ? 'opacity-50 scale-90 z-10'
                        : dragOverIndex === actualIndex
                        ? 'scale-105 sm:scale-110 ring-2 sm:ring-4 ring-green-400 shadow-xl sm:shadow-2xl z-50'
                        : activeSceneIndex === actualIndex
                        ? 'scale-105 ring-2 sm:ring-4 ring-yellow-400 shadow-xl sm:shadow-2xl z-50'
                        : 'hover:scale-105 hover:shadow-lg sm:hover:shadow-xl hover:z-50'
                    } ${isHidden ? 'opacity-40' : ''}`}
                    onClick={() => scrollToScene(entry.id, actualIndex)}
                  >
                    {/* Scene Card */}
                    <div className={`h-20 sm:h-24 md:h-28 rounded-lg sm:rounded-xl overflow-visible backdrop-blur-sm border ${
                      activeSceneIndex === actualIndex
                        ? 'bg-gradient-to-br from-yellow-400/50 via-amber-400/50 to-orange-400/50 border-yellow-300 shadow-lg'
                        : 'bg-white/10 border-white/20'
                    } ${isHidden ? 'bg-gray-400/30' : ''}`}>
                      {/* Action Buttons - Show on Hover */}
                      <div className="absolute -top-3 -right-3 z-[60] opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1.5 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copyScene(entry); }}
                          className="bg-purple-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-200 border-2 border-white ring-2 ring-purple-300"
                          title="Copy scene"
                        >
                          <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleHideScene(entry.id, e)}
                          className={`${isHidden ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-gray-800'} text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-200 border-2 border-white`}
                          title={isHidden ? "Unhide scene" : "Hide scene"}
                        >
                          {isHidden ? <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteSceneFromTimeline(entry.id, e)}
                          className="bg-red-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-2xl hover:scale-125 transition-all duration-200 border-2 border-white ring-2 ring-red-300"
                          title="Delete scene"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>

                      {/* Scene Number Badge */}
                      {editingTimelineSceneId === entry.id ? (
                        <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 z-[70] flex items-center space-x-0.5 sm:space-x-1 bg-white rounded-md sm:rounded-lg shadow-lg p-0.5 sm:p-1">
                          <input
                            type="number"
                            min="1"
                            max={timeline.length}
                            value={timelineSceneNumber}
                            onChange={(e) => setTimelineSceneNumber(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-10 sm:w-12 px-1 py-0.5 text-xs font-bold text-center border-2 border-purple-500 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); confirmTimelineSceneChange(actualIndex); }}
                            className="text-green-600 hover:text-green-700 p-0.5"
                          >
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); cancelTimelineSceneEdit(); }}
                            className="text-red-500 hover:text-red-600 p-0.5"
                          >
                            <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => startEditTimelineScene(entry.id, actualIndex, e)}
                          className={`absolute -top-1 -left-1 sm:-top-2 sm:-left-2 z-[60] text-white w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-lg hover:scale-110 transition-all group-hover:ring-2 ${
                            activeSceneIndex === actualIndex
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 ring-2 ring-yellow-300 scale-110'
                              : 'bg-gradient-to-br from-purple-500 to-blue-500 ring-yellow-300'
                          }`}
                          title="Click to edit scene number"
                        >
                          <span className="group-hover:hidden">{actualIndex + 1}</span>
                          <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 hidden group-hover:block" />
                        </button>
                      )}
                      
                      {/* Scene Content */}
                      <div className="p-2 sm:p-2.5 md:p-3 h-full flex flex-col justify-between pointer-events-none">
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <div className={`text-xs sm:text-sm font-bold line-clamp-2 mb-1 leading-tight pl-5 sm:pl-7 ${
                            activeSceneIndex === actualIndex ? 'text-gray-900 drop-shadow-sm' : 'text-white/90'
                          }`}>
                            {entry.event || `Scene ${actualIndex + 1}`}
                          </div>
                          {entry.description && (
                            <div className={`text-[10px] sm:text-xs line-clamp-2 leading-tight ${
                              activeSceneIndex === actualIndex ? 'text-gray-800' : 'text-white/70'
                            }`}>
                              {entry.description.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                        
                        {/* Scene Info */}
                        <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 flex-wrap">
                          {entry.characters.length > 0 && (
                            <div className={`flex items-center backdrop-blur-sm px-1.5 py-0.5 rounded-full ${
                              activeSceneIndex === actualIndex ? 'bg-gray-800/80' : 'bg-white/25'
                            }`}>
                              <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white mr-0.5" />
                              <span className="text-[10px] sm:text-xs text-white font-semibold">{entry.characters.length}</span>
                            </div>
                          )}
                          {entry.imageUrls.length > 0 && (
                            <div className={`flex items-center backdrop-blur-sm px-1.5 py-0.5 rounded-full ${
                              activeSceneIndex === actualIndex ? 'bg-gray-800/80' : 'bg-white/25'
                            }`}>
                              <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white mr-0.5" />
                              <span className="text-[10px] sm:text-xs text-white font-semibold">{entry.imageUrls.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center space-x-1 sm:space-x-2">
            <span className="text-white/70 text-xs hidden sm:inline">Quick Jump to Scene:</span>
            <input
              type="number"
              min="1"
              max={timeline.length}
              placeholder="Scene #"
              value={quickJumpValue}
              onChange={(e) => setQuickJumpValue(e.target.value)}
              className="w-16 sm:w-20 px-2 py-1 text-xs text-center bg-white/20 backdrop-blur-sm text-white placeholder-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickJump();
                }
              }}
            />
            <button
              type="button"
              onClick={handleQuickJump}
              disabled={!quickJumpValue}
              className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white px-2 sm:px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {timeline.length > 0 && (
        <div className="space-y-3">
          {/* Scene Visibility Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Filter Scenes:</label>
            <select
              value={sceneVisibilityFilter}
              onChange={(e) => {
                setSceneVisibilityFilter(e.target.value as 'all' | 'visible' | 'hidden');
                setCurrentScenePage(0);
              }}
              className="px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium text-sm"
            >
              <option value="all">All Scenes ({timeline.length})</option>
              <option value="visible">Visible Scenes ({timeline.filter(e => !hiddenScenes.has(e.id)).length})</option>
              <option value="hidden">Hidden Scenes ({hiddenScenes.size})</option>
            </select>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              placeholder="Search by scene number or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">📖 Story Timeline</h3>
          <button
            type="button"
            onClick={() => setShowCharacters(!showCharacters)}
            className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition flex items-center space-x-1"
          >
            <Users className="w-4 h-4" />
            <span>Characters ({availableCharacters.length})</span>
            {showCharacters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition flex items-center space-x-1"
            title="Collapse all scenes"
          >
            <ChevronUp className="w-4 h-4" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition flex items-center space-x-1"
            title="Expand all scenes"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <select
            value={scenesPerPageList}
            onChange={(e) => {
              setScenesPerPageList(Number(e.target.value));
              setCurrentScenePage(0);
            }}
            className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full border-0 hover:bg-gray-200 transition"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center space-x-1 shadow-sm"
          >
            <Film className="w-4 h-4" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            type="button"
            onClick={addTimelineEntry}
            className="text-sm bg-purple-600 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center space-x-1 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scene</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateNewScene}
            className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition flex items-center space-x-1 shadow-sm border border-indigo-400"
            title="Let AI create a new scene with characters"
          >
            <Wand2 className="w-4 h-4" />
            <span>AI Create Scene</span>
          </button>
          {copiedScene && (
            <button
              type="button"
              onClick={pasteScene}
              className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center space-x-1 shadow-sm"
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste Scene</span>
            </button>
          )}
        </div>
      </div>

      {/* All Characters Panel */}
      {showCharacters && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm animate-fadeIn">
          {editingCharacter ? (
            <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-md max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                <h4 className="text-base font-bold text-purple-900 flex items-center">
                  <Edit2 className="w-4 h-4 mr-2 text-purple-600" />
                  Edit Character
                </h4>
                <button onClick={() => setEditingCharacter(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingCharacter.name}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => handleCharacterAISuggestion('edit', 'name')}
                      disabled={aiLoadingState === 'edit-name'}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                      title="Suggest Name"
                    >
                      {aiLoadingState === 'edit-name' ? (
                        <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Actor</label>
                  <input
                    type="text"
                    value={editingCharacter.actorName || ''}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, actorName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Role</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editingCharacter.role}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, role: e.target.value })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => handleCharacterAISuggestion('edit', 'role')}
                      disabled={aiLoadingState === 'edit-role'}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                      title="Suggest Role"
                    >
                      {aiLoadingState === 'edit-role' ? (
                        <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Popularity (1-10)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={editingCharacter.popularity || 5}
                      onChange={(e) => setEditingCharacter({ ...editingCharacter, popularity: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <span className="text-sm font-bold text-purple-700 w-6 text-center">{editingCharacter.popularity || 5}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 mb-4">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <div className="relative">
                  <textarea
                    value={editingCharacter.description}
                    onChange={(e) => setEditingCharacter({ ...editingCharacter, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition h-20 resize-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => handleCharacterAISuggestion('edit', 'description')}
                    disabled={aiLoadingState === 'edit-description'}
                    className="absolute right-2 top-2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                    title="Suggest Description"
                  >
                    {aiLoadingState === 'edit-description' ? (
                      <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCharacter(null)}
                  className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateCharacter && editingCharacter) {
                      onUpdateCharacter(editingCharacter);
                      setEditingCharacter(null);
                      showToast(`Character "${editingCharacter.name}" updated!`);
                    }
                  }}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium shadow-sm flex items-center"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                <h4 className="text-sm font-bold text-purple-900 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-purple-600" />
                  All Characters ({availableCharacters.length})
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-sm">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Min Pop: {popularityFilter}</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={popularityFilter}
                      onChange={(e) => setPopularityFilter(parseInt(e.target.value))}
                      className="w-16 h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="text-xs bg-white text-purple-700 px-2 py-1 rounded-lg border border-purple-200 hover:bg-purple-50 transition flex items-center space-x-1 shadow-sm font-medium"
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span>Sort</span>
                  </button>
                  {copiedCharacter && (
                    <button
                      type="button"
                      onClick={pasteCharacter}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition flex items-center space-x-1 shadow-sm font-medium"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  )}
                </div>
              </div>
              
              {availableCharacters.length > 0 ? (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {availableCharacters
                    .filter(char => (char.popularity || 0) >= popularityFilter)
                    .sort((a, b) => {
                      const popA = a.popularity || 0;
                      const popB = b.popularity || 0;
                      if (popA !== popB) {
                        return sortOrder === 'desc' ? popB - popA : popA - popB;
                      }
                      return a.name.localeCompare(b.name);
                    })
                    .map((char, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden group">
                      <div className="p-2 flex-1 relative">
                        <div className="absolute top-0 right-0 p-1">
                           {char.popularity !== undefined && (
                            <div className="text-[10px] font-bold text-amber-600 flex items-center bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 shadow-sm">
                              <span className="mr-0.5">★</span>{char.popularity}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-1">
                          <div className="font-bold text-gray-900 text-xs truncate pr-8" title={char.name}>{char.name}</div>
                          
                          <div className="mt-1.5 space-y-0.5">
                            {char.actorName && (
                              <div className="text-[10px] text-purple-600 flex items-center truncate" title={`Actor: ${char.actorName}`}>
                                <Users className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
                                {char.actorName}
                              </div>
                            )}
                            {char.role && (
                              <div className="text-[10px] text-gray-500 truncate bg-gray-50 px-1 rounded inline-block max-w-full" title={char.role}>
                                {char.role}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Compact Action Footer */}
                      <div className="bg-gray-50 border-t border-gray-100 flex divide-x divide-gray-200">
                        <button
                          type="button"
                          onClick={() => copyCharacter(char)}
                          className="flex-1 py-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition flex justify-center items-center"
                          title="Copy"
                        >
                          <Clipboard className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateCharacter(char)}
                          className="flex-1 py-1.5 hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition flex justify-center items-center"
                          title="Clone"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {onUpdateCharacter && (
                          <button
                            type="button"
                            onClick={() => setEditingCharacter(char)}
                            className="flex-1 py-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 transition flex justify-center items-center"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteCharacter && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${char.name}"?`)) {
                                onDeleteCharacter(char);
                                showToast(`Character "${char.name}" deleted.`);
                              }
                            }}
                            className="flex-1 py-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 transition flex justify-center items-center"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-white rounded-lg border border-dashed border-purple-200">
                  <Users className="w-8 h-8 text-purple-200 mx-auto mb-2" />
                  <p className="text-xs text-purple-400">No characters found</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Scene Pagination Info */}
      {filteredTimeline.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{currentScenePage * scenesPerPageList + 1}</span> to{' '}
            <span className="font-semibold">{Math.min((currentScenePage + 1) * scenesPerPageList, filteredTimeline.length)}</span> of{' '}
            <span className="font-semibold">{filteredTimeline.length}</span> scenes
          </div>
          {totalScenePages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => goToSceneListPage(currentScenePage - 1)}
                disabled={currentScenePage === 0}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentScenePage + 1} of {totalScenePages}
              </span>
              <button
                type="button"
                onClick={() => goToSceneListPage(currentScenePage + 1)}
                disabled={currentScenePage === totalScenePages - 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline Entries */}
      <div className="space-y-3">
        {timeline.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No timeline entries yet. Click "Add Scene" to begin.</p>
          </div>
        ) : filteredTimeline.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">No scenes match your search "{searchQuery}"</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-purple-600 hover:text-purple-700 underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          paginatedScenes.map((entry) => {
            const originalIndex = timeline.findIndex(e => e.id === entry.id);
            return (
            <div 
              key={entry.id} 
              ref={el => { sceneRefs.current[entry.id] = el; }}
              className={`border-2 rounded-lg shadow-sm transition-all ${
                hiddenScenes.has(entry.id) 
                  ? 'border-gray-400 bg-gray-100 opacity-60' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Entry Header */}
              <div className={`flex items-center justify-between p-3 transition-colors ${
                hiddenScenes.has(entry.id)
                  ? 'bg-gradient-to-r from-gray-200 to-gray-300'
                  : 'bg-gradient-to-r from-purple-50 to-blue-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => toggleHideScene(entry.id, e)}
                    className={`${hiddenScenes.has(entry.id) ? 'bg-blue-600 ring-2 ring-blue-300' : 'bg-gray-700'} text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all`}
                    title={hiddenScenes.has(entry.id) ? "Unhide from story" : "Hide from story"}
                  >
                    {hiddenScenes.has(entry.id) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {editingSceneNumber === entry.id ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          max={timeline.length}
                          value={newSceneNumber}
                          onChange={(e) => setNewSceneNumber(e.target.value)}
                          className="w-16 px-2 py-1 border-2 border-purple-500 rounded text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-600"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => confirmSceneNumberChange(entry.id, originalIndex)}
                          className="text-green-600 hover:text-green-700 p-1"
                          title="Confirm"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditSceneNumber}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditSceneNumber(entry.id, originalIndex)}
                        className="bg-purple-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold hover:bg-purple-700 transition group relative"
                        title="Click to edit scene number"
                      >
                        {originalIndex + 1}
                        <Edit2 className="w-3 h-3 absolute opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    )}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Event Title (e.g., Opening Scene)"
                        value={entry.event}
                        onChange={(e) => updateEntry(entry.id, 'event', e.target.value)}
                        className="w-full px-3 py-1 border border-transparent hover:border-gray-300 focus:border-purple-500 bg-transparent hover:bg-white/50 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded transition-all pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => handleAISceneTitleSuggestion(entry.id)}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition opacity-0 group-hover:opacity-100"
                        title="Suggest Scene Title"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {/* Character badges in collapsed view */}
                  {!expandedEntries.has(entry.id) && entry.characters.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-9 mt-1">
                      {entry.characters.map((charName, cIdx) => {
                        const color = getCharacterColor(charName, allCharacterNames);
                        return (
                          <span key={cIdx} className={`${color.bg} ${color.text} px-2 py-0.5 rounded-full text-xs font-semibold border ${color.border}`}>
                            {charName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {originalIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => moveEntry(entry.id, 'up')}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                  {originalIndex < timeline.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveEntry(entry.id, 'down')}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(entry.id)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    {expandedEntries.has(entry.id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-red-500 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyScene(entry)}
                    className="text-blue-500 hover:text-blue-600 p-1"
                    title="Copy Scene"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Entry Details (Expandable) */}
              {expandedEntries.has(entry.id) && (
                <div className="p-4 space-y-3">
                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Scene Description
                      {entry.characters.length > 0 && (
                        <span className="text-xs text-purple-600 ml-2">
                          (Use character names in bold/italic: they'll be auto-formatted)
                        </span>
                      )}
                    </label>
                    <div className="relative group/textarea">
                      <textarea
                        placeholder={
                          entry.characters.length > 0
                            ? `Describe what happens with ${entry.characters.join(', ')}...`
                            : "First select characters for this scene, then describe what happens..."
                        }
                        value={entry.description}
                        onChange={(e) => handleDescriptionChange(entry.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab' && realTimeSuggestion && activeEntry?.id === entry.id) {
                            e.preventDefault();
                            acceptSuggestion(entry.id);
                          }
                        }}
                        onFocus={() => setLastFocusedSceneId(entry.id)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 h-24 text-sm leading-relaxed"
                      />
                      
                      {/* Real-time Suggestion Bubble */}
                      {activeEntry?.id === entry.id && (realTimeSuggestion || isTyping) && (
                        <div className="absolute bottom-2 right-2 z-20 max-w-md animate-fadeIn">
                          {isTyping ? (
                            <div className="bg-white/90 backdrop-blur shadow-lg rounded-lg px-3 py-1.5 border border-purple-100 flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" />
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" />
                              <span className="text-xs text-purple-600 font-medium">AI thinking...</span>
                            </div>
                          ) : realTimeSuggestion && (
                            <div className="bg-white shadow-xl rounded-xl border border-purple-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 border-b border-purple-100 flex justify-between items-center">
                                <div className="flex items-center space-x-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                  <span className="text-xs font-bold text-purple-800">AI Suggestion</span>
                                </div>
                                <button 
                                  onClick={() => setRealTimeSuggestion(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="p-3 bg-white/95 backdrop-blur-sm">
                                <p className="text-sm text-gray-700 leading-relaxed mb-2 font-serif italic">
                                  "...{realTimeSuggestion}"
                                </p>
                                <button
                                  onClick={() => acceptSuggestion(entry.id)}
                                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center space-x-1 shadow-sm"
                                >
                                  <span>Press Tab to Accept</span>
                                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] ml-1">⇥</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Characters Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Characters in this scene:</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Auto-detect all characters mentioned in scene description
                            const detectedChars: string[] = [];
                            const sceneText = entry.description + ' ' + entry.event;
                            
                            availableCharacters.forEach(char => {
                              const nameRegex = new RegExp(`\\b${char.name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
                              if (nameRegex.test(sceneText) && !entry.characters.includes(char.name)) {
                                detectedChars.push(char.name);
                              }
                            });
                            
                            if (detectedChars.length > 0) {
                              const updatedCharacters = [...entry.characters, ...detectedChars];
                              updateEntry(entry.id, 'characters', updatedCharacters);
                              showToast(`Selected ${detectedChars.length} characters: ${detectedChars.join(', ')}`, 'success');
                            } else {
                              showToast('No additional characters detected in scene text', 'info');
                            }
                          }}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-1"
                          title="Auto-select all characters mentioned in scene"
                        >
                          <Users className="w-3 h-3" />
                          Auto-Select All
                        </button>
                        <span className="text-xs text-gray-500">Group by:</span>
                        <select 
                          className="text-xs border-gray-300 rounded-md shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                          disabled
                          title="Grouping by Role is enabled by default"
                        >
                          <option>Role</option>
                        </select>
                      </div>
                    </div>

                    {/* Selected Characters (Always Visible) */}
                    {entry.characters.length > 0 && (
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <span className="text-xs font-semibold text-purple-800 block mb-2">Selected</span>
                        <div className="flex flex-wrap gap-2">
                          {entry.characters.map((charName, idx) => {
                            const char = availableCharacters.find(c => c.name === charName);
                            const color = getCharacterColor(charName, allCharacterNames);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => toggleCharacter(entry.id, charName)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition border-2 flex items-center gap-2 ${color.bg} ${color.text} ${color.border} hover:opacity-80`}
                              >
                                {char?.imageUrls && char.imageUrls.length > 0 && (
                                  <img 
                                    src={char.imageUrls[0].startsWith('http') ? char.imageUrls[0] : `http://localhost:8080${char.imageUrls[0]}`} 
                                    alt={charName} 
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                )}
                                {charName}
                                <XCircle className="w-3 h-3 ml-1 opacity-50" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Available Characters (Grouped by Role) */}
                    <div className="space-y-3">
                      {(() => {
                        const unselectedChars = availableCharacters
                          .filter(c => !entry.characters.includes(c.name))
                          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

                        // Group by Role
                        const groupedChars: Record<string, Character[]> = {};
                        unselectedChars.forEach(char => {
                          const role = char.role || 'Unspecified';
                          if (!groupedChars[role]) groupedChars[role] = [];
                          groupedChars[role].push(char);
                        });

                        // Sort roles alphabetically but put 'Unspecified' last
                        const sortedRoles = Object.keys(groupedChars).sort((a, b) => {
                          if (a === 'Unspecified') return 1;
                          if (b === 'Unspecified') return -1;
                          return a.localeCompare(b);
                        });

                        return sortedRoles.map(role => (
                          <div key={role} className="border-l-2 border-gray-200 pl-3">
                            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{role}</h6>
                            <div className="flex flex-wrap gap-2">
                              {groupedChars[role].map((char, idx) => {
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => toggleCharacter(entry.id, char.name)}
                                    className="px-3 py-1.5 rounded-full text-sm font-medium transition border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-700 flex items-center gap-2"
                                  >
                                    {char.imageUrls && char.imageUrls.length > 0 && (
                                      <img 
                                        src={char.imageUrls[0].startsWith('http') ? char.imageUrls[0] : `http://localhost:8080${char.imageUrls[0]}`} 
                                        alt={char.name} 
                                        className="w-5 h-5 rounded-full object-cover opacity-70"
                                      />
                                    )}
                                    {char.name}
                                    {char.popularity !== undefined && (
                                      <span className="text-[10px] text-amber-500 flex items-center ml-1">
                                        ★{char.popularity}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                      
                      <button
                        type="button"
                        onClick={() => setShowNewCharacterForm(entry.id)}
                        className="px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 hover:bg-green-100 transition flex items-center border border-green-200 mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create New Character
                      </button>
                    </div>
                    
                    {entry.characters.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        ℹ️ Only these characters can be mentioned in this scene's description
                      </div>
                    )}
                  </div>

                  {/* New Character Form */}
                  {showNewCharacterForm === entry.id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <h5 className="text-sm font-semibold text-green-800">Add New Character</h5>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Character Name"
                          value={newCharacter.name}
                          onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => handleCharacterAISuggestion('new', 'name')}
                          disabled={aiLoadingState === 'new-name'}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                          title="Suggest Name"
                        >
                          {aiLoadingState === 'new-name' ? (
                            <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Actor Name (optional)"
                        value={newCharacter.actorName}
                        onChange={(e) => setNewCharacter({ ...newCharacter, actorName: e.target.value })}
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Role (e.g., Protagonist)"
                            value={newCharacter.role}
                            onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
                            className="w-full px-3 py-1 border border-gray-300 rounded text-sm pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => handleCharacterAISuggestion('new', 'role')}
                            disabled={aiLoadingState === 'new-role'}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                            title="Suggest Role"
                          >
                            {aiLoadingState === 'new-role' ? (
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
                          placeholder="Popularity (1-10)"
                          value={newCharacter.popularity || ''}
                          onChange={(e) => setNewCharacter({ ...newCharacter, popularity: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="relative">
                        <textarea
                          placeholder="Character Description"
                          value={newCharacter.description}
                          onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                          className="w-full px-3 py-1 border border-gray-300 rounded text-sm h-16 pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => handleCharacterAISuggestion('new', 'description')}
                          disabled={aiLoadingState === 'new-description'}
                          className="absolute right-2 top-2 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                          title="Suggest Description"
                        >
                          {aiLoadingState === 'new-description' ? (
                            <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAddNewCharacter(entry.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Add Character
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewCharacterForm(null);
                            setNewCharacter({ name: '', description: '', role: '', actorName: '', popularity: undefined });
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Images Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Scene Images
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center text-sm">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(entry.id, e)}
                          className="hidden"
                          disabled={uploadingImages === entry.id}
                        />
                      </label>
                      {uploadingImages === entry.id && <span className="text-xs text-gray-600">Uploading...</span>}
                    </div>
                    {entry.imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {entry.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={url.startsWith('http') ? url : `http://localhost:8080${url}`} 
                              alt={`Scene image ${idx + 1}`} 
                              className="w-full h-16 sm:h-20 object-cover rounded border border-gray-300 group-hover:border-purple-400 transition" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10"%3EError%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(entry.id, idx)}
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      Scene Videos
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 flex items-center text-sm">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Video
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={(e) => handleVideoUpload(entry.id, e)}
                          className="hidden"
                          disabled={uploadingVideos === entry.id}
                        />
                      </label>
                      {uploadingVideos === entry.id && <span className="text-xs text-gray-600">Uploading...</span>}
                    </div>
                    {entry.videoUrls && entry.videoUrls.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entry.videoUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <video 
                              src={url.startsWith('http') ? url : `http://localhost:8080${url}`} 
                              controls
                              className="w-full h-32 object-cover rounded border border-gray-300" 
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(entry.id, idx)}
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Music className="w-4 h-4 mr-1" />
                      Scene Audio
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="cursor-pointer bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 flex items-center text-sm">
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Audio
                        <input
                          type="file"
                          multiple
                          accept="audio/*"
                          onChange={(e) => handleAudioUpload(entry.id, e)}
                          className="hidden"
                          disabled={uploadingAudio === entry.id}
                        />
                      </label>
                      {uploadingAudio === entry.id && <span className="text-xs text-gray-600">Uploading...</span>}
                    </div>
                    {entry.audioUrls && entry.audioUrls.length > 0 && (
                      <div className="space-y-2">
                        {entry.audioUrls.map((url, idx) => (
                          <div key={idx} className="relative group flex items-center bg-gray-50 p-2 rounded border border-gray-200">
                            <audio 
                              src={url.startsWith('http') ? url : `http://localhost:8080${url}`} 
                              controls
                              className="w-full h-8" 
                            />
                            <button
                              type="button"
                              onClick={() => removeAudio(entry.id, idx)}
                              className="ml-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-800">Scene Actions</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyScene(entry)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center space-x-1"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span>Copy Scene</span>
                      </button>
                      <button
                        type="button"
                        onClick={pasteScene}
                        disabled={!copiedScene}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span>Paste Scene</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {/* Bottom Pagination */}
      {totalScenePages > 1 && filteredTimeline.length > 0 && (
        <div className="flex items-center justify-center space-x-2 pt-2">
          <button
            type="button"
            onClick={() => goToSceneListPage(0)}
            disabled={currentScenePage === 0}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            First
          </button>
          <button
            type="button"
            onClick={() => goToSceneListPage(currentScenePage - 1)}
            disabled={currentScenePage === 0}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">
            {currentScenePage + 1} / {totalScenePages}
          </div>
          <button
            type="button"
            onClick={() => goToSceneListPage(currentScenePage + 1)}
            disabled={currentScenePage === totalScenePages - 1}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goToSceneListPage(totalScenePages - 1)}
            disabled={currentScenePage === totalScenePages - 1}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Last
          </button>
        </div>
      )}

      {/* Generate Story Preview - Enhanced Modal with Book-like Layout */}
      {showPreview && timeline.length > 0 && (() => {
        const visibleScenes = filteredTimeline.filter(e => !hiddenScenes.has(e.id)).sort((a, b) => a.order - b.order);
        const totalPages = Math.ceil(visibleScenes.length / previewScenesPerPage);
        const paginatedScenes = visibleScenes.slice(
          previewPage * previewScenesPerPage,
          (previewPage + 1) * previewScenesPerPage
        );
        
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">📜 Story Preview</h3>
                    <p className="text-sm text-gray-600 mt-1">{visibleScenes.length} visible scenes</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewWriterMode(!previewWriterMode);
                        setPreviewPage(0);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        previewWriterMode
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      {previewWriterMode ? 'Writer' : 'Reader'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                {/* Scenes per page control */}
                <div className="flex items-center space-x-3 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                  <label className="text-sm font-semibold text-purple-900">Scenes per page:</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewScenesPerPage(Math.max(MIN_PREVIEW_SCENES, previewScenesPerPage - 1));
                        setPreviewPage(0);
                      }}
                      className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 bg-white border border-purple-300 rounded font-bold text-purple-900 min-w-[40px] text-center">
                      {previewScenesPerPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewScenesPerPage(Math.min(
                          previewWriterMode ? MAX_PREVIEW_SCENES_WRITER : MAX_PREVIEW_SCENES_READER,
                          previewScenesPerPage + 1
                        ));
                        setPreviewPage(0);
                      }}
                      className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-bold"
                    >
                      +
                    </button>
                    <span className="text-xs text-purple-600">
                      (range: {MIN_PREVIEW_SCENES}-{previewWriterMode ? MAX_PREVIEW_SCENES_WRITER : MAX_PREVIEW_SCENES_READER})
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Content - Book-like Layout */}
              <div className="overflow-y-auto p-4 sm:p-8 flex-1">
                <div className={`rounded-lg shadow-lg p-6 sm:p-10 ${
                  previewWriterMode ? 'bg-white' : 'bg-amber-50'
                }`}>
                  <div className="max-w-4xl mx-auto space-y-6">
                    {paginatedScenes.map((entry, idx) => {
                      const actualSceneNumber = previewPage * previewScenesPerPage + idx + 1;
                      
                      return (
                        <div key={entry.id} className={previewWriterMode ? "mb-8 last:mb-0" : "mb-6 last:mb-0"}>
                          {/* Scene Header - Only in Writer Mode */}
                          {previewWriterMode && (
                            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                Scene {actualSceneNumber}: {entry.event || 'Untitled'}
                              </h4>
                              {entry.characters && entry.characters.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {entry.characters.map((charName, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-semibold border border-purple-300"
                                    >
                                      {charName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Scene Description */}
                          <div className={previewWriterMode
                            ? "text-lg leading-loose text-gray-900 mb-4 font-serif whitespace-pre-wrap"
                            : "text-justify text-lg leading-relaxed text-gray-800 mb-4 font-serif whitespace-pre-wrap"
                          } style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word'
                          }}>
                            {entry.description ? (
                              (() => {
                                const paragraphs = entry.description.split(/\n\n+/);
                                return paragraphs.map((paragraph, pIdx) => (
                                  <p key={pIdx} className={!previewWriterMode && pIdx > 0 ? "indent-8 mt-4" : pIdx > 0 ? "mt-4" : previewWriterMode ? "" : "indent-8"}>
                                    {entry.characters && entry.characters.length > 0 ? (
                                      paragraph.split(new RegExp(`\\b(${entry.characters.join('|')})\\b`, 'gi')).map((part, i) => {
                                        const isCharacter = entry.characters?.some(c => c.toLowerCase() === part.toLowerCase());
                                       
                                        if (isCharacter && part.trim()) {
                                          return (
                                            <span
                                              key={i}
                                              className="font-bold"
                                              style={{ color: '#7c3aed' }}
                                            >
                                              {part}
                                            </span>
                                          );
                                        }
                                        return <span key={i}>{part}</span>;
                                      })
                                    ) : paragraph}
                                  </p>
                                ));
                              })()
                            ) : (
                              <span className="text-gray-400 italic text-base">No description</span>
                            )}
                          </div>
                          
                          {/* Scene Images - Only in Writer Mode */}
                          {previewWriterMode && entry.imageUrls && entry.imageUrls.length > 0 && (
                            <div className="mb-4 pl-4 border-l-4 border-gray-200">
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {entry.imageUrls.map((url, imgIdx) => (
                                  <img
                                    key={imgIdx}
                                    src={`http://localhost:8080${url}`}
                                    alt={`Scene ${actualSceneNumber} - Image ${imgIdx + 1}`}
                                    className="w-full h-16 sm:h-20 object-cover rounded border border-gray-300 hover:border-purple-500 transition cursor-pointer shadow-sm hover:shadow-md"
                                    onClick={() => window.open(`http://localhost:8080${url}`, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer with Pagination and Search */}
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-300 mb-3">
                  {/* Top Row: Scene count and page navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-600">
                      Showing scenes <span className="font-semibold">{previewPage * previewScenesPerPage + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min((previewPage + 1) * previewScenesPerPage, visibleScenes.length)}</span> of{' '}
                      <span className="font-semibold">{visibleScenes.length}</span>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                          disabled={previewPage === 0}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                          {previewPage + 1} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPreviewPage(Math.min(totalPages - 1, previewPage + 1))}
                          disabled={previewPage === totalPages - 1}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Row: Search Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Search by Page Number */}
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <Search className="w-4 h-4 text-blue-600" />
                      <input
                        type="number"
                        placeholder="Go to page..."
                        value={searchPageNumber}
                        onChange={(e) => setSearchPageNumber(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const pageNum = parseInt(searchPageNumber);
                            if (pageNum >= 1 && pageNum <= totalPages) {
                              setPreviewPage(pageNum - 1);
                              setSearchPageNumber('');
                            } else {
                              showToast(`Please enter a page number between 1 and ${totalPages}`, 'error');
                            }
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max={totalPages}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const pageNum = parseInt(searchPageNumber);
                          if (pageNum >= 1 && pageNum <= totalPages) {
                            setPreviewPage(pageNum - 1);
                            setSearchPageNumber('');
                          } else {
                            showToast(`Please enter a page number between 1 and ${totalPages}`, 'error');
                          }
                        }}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-semibold"
                      >
                        Go
                      </button>
                    </div>
                    
                    {/* Search by Scene Number */}
                    <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <Search className="w-4 h-4 text-green-600" />
                      <input
                        type="number"
                        placeholder="Go to scene..."
                        value={searchSceneNumber}
                        onChange={(e) => setSearchSceneNumber(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const sceneNum = parseInt(searchSceneNumber);
                            if (sceneNum >= 1 && sceneNum <= visibleScenes.length) {
                              const targetPage = Math.floor((sceneNum - 1) / previewScenesPerPage);
                              setPreviewPage(targetPage);
                              setSearchSceneNumber('');
                            } else {
                              showToast(`Please enter a scene number between 1 and ${visibleScenes.length}`, 'error');
                            }
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        min="1"
                        max={visibleScenes.length}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const sceneNum = parseInt(searchSceneNumber);
                          if (sceneNum >= 1 && sceneNum <= visibleScenes.length) {
                            const targetPage = Math.floor((sceneNum - 1) / previewScenesPerPage);
                            setPreviewPage(targetPage);
                            setSearchSceneNumber('');
                          } else {
                            showToast(`Please enter a scene number between 1 and ${visibleScenes.length}`, 'error');
                          }
                        }}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs font-semibold"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      const story = generateStoryFromTimeline();
                      navigator.clipboard.writeText(story);
                      showToast('Story copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                  >
                    Copy Story
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-xl text-white font-medium z-[100] transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <Check className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'info' && <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs">i</div>}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Scene?</h3>
            <p className="text-center text-gray-600 mb-6">
              Are you sure you want to delete this scene? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <AIAssistant 
        context={aiContext}
        onSuggestionAccepted={handleAISuggestion}
        onSceneGenerated={handleAISceneGeneration}
      />
    </div>
  );
};

export default TimelineManager;
