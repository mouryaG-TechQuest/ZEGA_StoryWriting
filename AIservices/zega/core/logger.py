"""
Production Logger for ZEGA
Replaces print statements with structured logging
"""
import logging
import os
from logging.handlers import RotatingFileHandler

class ZEGALogger:
    """Centralized logger for ZEGA system"""
    
    _loggers = {}
    
    @classmethod
    def get_logger(cls, name: str) -> logging.Logger:
        """Get or create a logger instance"""
        if name in cls._loggers:
            return cls._loggers[name]
        
        logger = logging.getLogger(name)
        
        # Only add handlers if not already added
        if not logger.handlers:
            # Set level from environment or default to WARNING in production
            log_level = os.getenv('LOG_LEVEL', 'WARNING').upper()
            logger.setLevel(getattr(logging, log_level, logging.WARNING))
            
            # Console handler with simple format
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%H:%M:%S'
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)
            
            # File handler for errors only (rotating)
            if os.getenv('ENABLE_FILE_LOGGING', 'false').lower() == 'true':
                file_handler = RotatingFileHandler(
                    'zega_errors.log',
                    maxBytes=5*1024*1024,  # 5MB
                    backupCount=3
                )
                file_handler.setLevel(logging.ERROR)
                file_formatter = logging.Formatter(
                    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
                )
                file_handler.setFormatter(file_formatter)
                logger.addHandler(file_handler)
        
        cls._loggers[name] = logger
        return logger

# Convenience functions
def get_logger(name: str) -> logging.Logger:
    """Get a logger instance"""
    return ZEGALogger.get_logger(name)

# Module-level logger instances
ensemble_logger = get_logger('zega.ensemble')
auto_trainer_logger = get_logger('zega.auto_trainer')
agent_logger = get_logger('zega.agent')
finetuning_logger = get_logger('zega.finetuning')
model_logger = get_logger('zega.model')
