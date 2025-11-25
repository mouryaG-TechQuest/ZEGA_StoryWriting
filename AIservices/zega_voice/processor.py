"""
ZEGA Voice Processing Core
Supports multiple free APIs for voice features:
- Google Speech-to-Text (free tier)
- OpenAI Whisper (local or API)
- Edge TTS (free, Microsoft)
- Google TTS (free tier)
- Coqui TTS (local, open source)
"""

import os
import asyncio
import httpx
import base64
import json
import tempfile
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime
import io

# Optional imports
try:
    import edge_tts
    EDGE_TTS_AVAILABLE = True
except ImportError:
    EDGE_TTS_AVAILABLE = False

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False

@dataclass
class TranscriptionResult:
    """Result from speech-to-text"""
    success: bool
    text: str = ""
    language: str = "en"
    confidence: float = 0.0
    timestamps: Optional[List[Dict[str, Any]]] = None  # Word-level timestamps
    error: Optional[str] = None
    provider: str = ""

@dataclass
class SynthesisResult:
    """Result from text-to-speech"""
    success: bool
    audio_data: Optional[bytes] = None
    audio_format: str = "mp3"
    duration: float = 0.0
    error: Optional[str] = None
    provider: str = ""
    voice_used: str = ""

@dataclass
class SubtitleEntry:
    """Single subtitle entry with timing"""
    start_time: float  # seconds
    end_time: float
    text: str
    speaker: Optional[str] = None

class WhisperProvider:
    """OpenAI Whisper API or local Whisper model"""
    
    def __init__(self, use_api: bool = True):
        self.use_api = use_api
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.name = "whisper"
        
        # Try to load local whisper if no API key
        self.local_model = None
        if not self.api_key or not use_api:
            try:
                import whisper
                self.local_model = whisper.load_model("base")
                print("[ZEGA_Voice] ✅ Loaded local Whisper model")
            except ImportError:
                print("[ZEGA_Voice] ⚠️ Local Whisper not available")
    
    async def transcribe(self, audio_data: bytes, language: str = "en") -> TranscriptionResult:
        """Transcribe audio to text"""
        try:
            if self.local_model:
                return await self._transcribe_local(audio_data, language)
            elif self.api_key:
                return await self._transcribe_api(audio_data, language)
            else:
                return TranscriptionResult(
                    success=False,
                    error="No Whisper model available",
                    provider=self.name
                )
        except Exception as e:
            return TranscriptionResult(
                success=False,
                error=str(e),
                provider=self.name
            )
    
    async def _transcribe_api(self, audio_data: bytes, language: str) -> TranscriptionResult:
        """Use OpenAI Whisper API"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Create a temporary file for the audio
            files = {
                "file": ("audio.wav", audio_data, "audio/wav"),
                "model": (None, "whisper-1"),
                "language": (None, language),
                "response_format": (None, "verbose_json")
            }
            
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                files=files,
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return TranscriptionResult(
                    success=True,
                    text=data.get("text", ""),
                    language=data.get("language", language),
                    timestamps=data.get("segments", []),
                    provider=self.name
                )
            else:
                return TranscriptionResult(
                    success=False,
                    error=f"API error: {response.text[:200]}",
                    provider=self.name
                )
    
    async def _transcribe_local(self, audio_data: bytes, language: str) -> TranscriptionResult:
        """Use local Whisper model"""
        import tempfile
        
        # Save audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            temp_path = f.name
        
        try:
            # Run transcription in thread pool
            result = await asyncio.to_thread(
                self.local_model.transcribe,
                temp_path,
                language=language
            )
            
            return TranscriptionResult(
                success=True,
                text=result.get("text", ""),
                language=result.get("language", language),
                timestamps=result.get("segments", []),
                provider=f"{self.name}_local"
            )
        finally:
            os.unlink(temp_path)

class HuggingFaceSTTProvider:
    """HuggingFace Inference API for Speech-to-Text"""
    
    def __init__(self, model: str = "openai/whisper-large-v3"):
        self.api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.model = model
        self.base_url = f"https://api-inference.huggingface.co/models/{model}"
        self.name = "huggingface_stt"
    
    async def transcribe(self, audio_data: bytes, language: str = "en") -> TranscriptionResult:
        """Transcribe audio using HuggingFace"""
        if not self.api_key:
            return TranscriptionResult(
                success=False,
                error="HUGGINGFACEHUB_API_TOKEN not set",
                provider=self.name
            )
        
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    content=audio_data,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "audio/wav"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    text = data.get("text", "") if isinstance(data, dict) else str(data)
                    return TranscriptionResult(
                        success=True,
                        text=text,
                        language=language,
                        provider=self.name
                    )
                else:
                    return TranscriptionResult(
                        success=False,
                        error=f"API error {response.status_code}: {response.text[:200]}",
                        provider=self.name
                    )
        except Exception as e:
            return TranscriptionResult(
                success=False,
                error=str(e),
                provider=self.name
            )

class EdgeTTSProvider:
    """Microsoft Edge TTS - Completely free"""
    
    VOICES = {
        "en-US": [
            "en-US-JennyNeural",  # Female
            "en-US-GuyNeural",    # Male
            "en-US-AriaNeural",   # Female (expressive)
            "en-US-DavisNeural",  # Male (expressive)
        ],
        "en-GB": [
            "en-GB-SoniaNeural",
            "en-GB-RyanNeural",
        ],
        "es-ES": [
            "es-ES-ElviraNeural",
            "es-ES-AlvaroNeural",
        ]
    }
    
    def __init__(self):
        self.name = "edge_tts"
        self.available = EDGE_TTS_AVAILABLE
    
    async def synthesize(
        self, 
        text: str, 
        voice: str = "en-US-JennyNeural",
        rate: str = "+0%",
        pitch: str = "+0Hz"
    ) -> SynthesisResult:
        """Synthesize speech from text"""
        if not self.available:
            return SynthesisResult(
                success=False,
                error="edge-tts not installed",
                provider=self.name
            )
        
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            
            # Collect audio data
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
            
            audio_data = b"".join(audio_chunks)
            
            return SynthesisResult(
                success=True,
                audio_data=audio_data,
                audio_format="mp3",
                provider=self.name,
                voice_used=voice
            )
        except Exception as e:
            return SynthesisResult(
                success=False,
                error=str(e),
                provider=self.name
            )
    
    async def get_voices(self) -> List[Dict[str, str]]:
        """Get available voices"""
        if not self.available:
            return []
        
        try:
            voices = await edge_tts.list_voices()
            return [
                {
                    "name": v["Name"],
                    "short_name": v["ShortName"],
                    "gender": v["Gender"],
                    "locale": v["Locale"]
                }
                for v in voices
            ]
        except:
            return []

class GoogleTTSProvider:
    """Google TTS (gTTS) - Free"""
    
    def __init__(self):
        self.name = "gtts"
        self.available = GTTS_AVAILABLE
    
    async def synthesize(self, text: str, language: str = "en") -> SynthesisResult:
        """Synthesize speech from text"""
        if not self.available:
            return SynthesisResult(
                success=False,
                error="gTTS not installed",
                provider=self.name
            )
        
        try:
            # Run in thread pool (gTTS is synchronous)
            def generate():
                tts = gTTS(text=text, lang=language)
                audio_buffer = io.BytesIO()
                tts.write_to_fp(audio_buffer)
                return audio_buffer.getvalue()
            
            audio_data = await asyncio.to_thread(generate)
            
            return SynthesisResult(
                success=True,
                audio_data=audio_data,
                audio_format="mp3",
                provider=self.name,
                voice_used=f"gtts-{language}"
            )
        except Exception as e:
            return SynthesisResult(
                success=False,
                error=str(e),
                provider=self.name
            )

class ZegaVoiceProcessor:
    """
    Main voice processing orchestrator
    Handles STT, TTS, and subtitle generation
    """
    
    def __init__(self, training_data_path: str = "zega_voice_training"):
        self.training_data_path = Path(training_data_path)
        self.training_data_path.mkdir(exist_ok=True)
        
        # Initialize providers
        self.stt_providers = []
        self.tts_providers = []
        
        self._init_providers()
        print(f"[ZEGA_Voice] 🎙️ Initialized with {len(self.stt_providers)} STT and {len(self.tts_providers)} TTS providers")
    
    def _init_providers(self):
        """Initialize all available voice providers"""
        # STT Providers
        if os.getenv("HUGGINGFACEHUB_API_TOKEN"):
            self.stt_providers.append(HuggingFaceSTTProvider())
            print("[ZEGA_Voice] ✅ Loaded: HuggingFace STT")
        
        whisper = WhisperProvider()
        if whisper.local_model or whisper.api_key:
            self.stt_providers.append(whisper)
            print(f"[ZEGA_Voice] ✅ Loaded: Whisper ({'local' if whisper.local_model else 'API'})")
        
        # TTS Providers
        edge = EdgeTTSProvider()
        if edge.available:
            self.tts_providers.append(edge)
            print("[ZEGA_Voice] ✅ Loaded: Edge TTS")
        
        gtts = GoogleTTSProvider()
        if gtts.available:
            self.tts_providers.append(gtts)
            print("[ZEGA_Voice] ✅ Loaded: Google TTS")
    
    async def transcribe(
        self, 
        audio_data: bytes, 
        language: str = "en"
    ) -> TranscriptionResult:
        """
        Transcribe audio to text using the best available provider
        """
        for provider in self.stt_providers:
            try:
                result = await provider.transcribe(audio_data, language)
                if result.success:
                    print(f"[ZEGA_Voice] ✅ Transcription success from {provider.name}")
                    return result
                else:
                    print(f"[ZEGA_Voice] ⚠️ {provider.name} failed: {result.error}")
            except Exception as e:
                print(f"[ZEGA_Voice] ❌ {provider.name} error: {e}")
        
        return TranscriptionResult(
            success=False,
            error="All STT providers failed",
            provider="none"
        )
    
    async def synthesize(
        self, 
        text: str,
        voice: Optional[str] = None,
        language: str = "en"
    ) -> SynthesisResult:
        """
        Synthesize speech from text using the best available provider
        """
        for provider in self.tts_providers:
            try:
                if hasattr(provider, 'synthesize'):
                    if provider.name == "edge_tts" and voice:
                        result = await provider.synthesize(text, voice=voice)
                    elif provider.name == "gtts":
                        result = await provider.synthesize(text, language=language)
                    else:
                        result = await provider.synthesize(text)
                    
                    if result.success:
                        print(f"[ZEGA_Voice] ✅ Synthesis success from {provider.name}")
                        return result
                    else:
                        print(f"[ZEGA_Voice] ⚠️ {provider.name} failed: {result.error}")
            except Exception as e:
                print(f"[ZEGA_Voice] ❌ {provider.name} error: {e}")
        
        return SynthesisResult(
            success=False,
            error="All TTS providers failed",
            provider="none"
        )
    
    async def generate_subtitles(
        self, 
        audio_data: bytes,
        language: str = "en",
        format: str = "srt"
    ) -> Tuple[bool, str]:
        """
        Generate subtitles from audio
        Returns (success, subtitle_content)
        """
        # First transcribe with timestamps
        result = await self.transcribe(audio_data, language)
        
        if not result.success or not result.timestamps:
            return False, result.error or "No timestamps available"
        
        # Convert to subtitle format
        if format == "srt":
            return True, self._to_srt(result.timestamps)
        elif format == "vtt":
            return True, self._to_vtt(result.timestamps)
        else:
            return False, f"Unknown format: {format}"
    
    def _to_srt(self, segments: List[Dict]) -> str:
        """Convert segments to SRT format"""
        lines = []
        for i, seg in enumerate(segments, 1):
            start = self._format_timestamp_srt(seg.get("start", 0))
            end = self._format_timestamp_srt(seg.get("end", 0))
            text = seg.get("text", "").strip()
            lines.append(f"{i}")
            lines.append(f"{start} --> {end}")
            lines.append(text)
            lines.append("")
        return "\n".join(lines)
    
    def _to_vtt(self, segments: List[Dict]) -> str:
        """Convert segments to WebVTT format"""
        lines = ["WEBVTT", ""]
        for seg in segments:
            start = self._format_timestamp_vtt(seg.get("start", 0))
            end = self._format_timestamp_vtt(seg.get("end", 0))
            text = seg.get("text", "").strip()
            lines.append(f"{start} --> {end}")
            lines.append(text)
            lines.append("")
        return "\n".join(lines)
    
    def _format_timestamp_srt(self, seconds: float) -> str:
        """Format seconds to SRT timestamp (HH:MM:SS,mmm)"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    
    def _format_timestamp_vtt(self, seconds: float) -> str:
        """Format seconds to VTT timestamp (HH:MM:SS.mmm)"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"
    
    async def narrate_scene(
        self,
        scene_title: str,
        scene_description: str,
        voice: str = "en-US-JennyNeural",
        include_title: bool = True
    ) -> SynthesisResult:
        """
        Generate audio narration for a scene
        """
        # Build narration text
        parts = []
        if include_title and scene_title:
            parts.append(scene_title + ".")
        if scene_description:
            parts.append(scene_description)
        
        text = " ".join(parts)
        
        if not text:
            return SynthesisResult(
                success=False,
                error="No text to narrate"
            )
        
        return await self.synthesize(text, voice=voice)
    
    async def get_available_voices(self) -> List[Dict[str, str]]:
        """Get all available TTS voices"""
        voices = []
        for provider in self.tts_providers:
            if hasattr(provider, 'get_voices'):
                provider_voices = await provider.get_voices()
                voices.extend(provider_voices)
        return voices
