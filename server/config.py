"""
Configuration file for credentials and settings.
Keep this file secure and do not commit actual credentials to version control.
"""

import os
from typing import Optional

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT: Optional[str] = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_API_KEY: Optional[str] = os.getenv('AZURE_OPENAI_API_KEY')
AZURE_OPENAI_DEPLOYMENT_NAME: str = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o')
AZURE_OPENAI_API_VERSION: str = os.getenv('AZURE_OPENAI_API_VERSION', '2024-12-01-preview')
USE_ENTRA_ID: bool = os.getenv('USE_ENTRA_ID', 'False').lower() == 'true'

# Snowflake Configuration
SNOWFLAKE_ACCOUNT: str = os.getenv('SNOWFLAKE_ACCOUNT', '')
SNOWFLAKE_USER: str = os.getenv('SNOWFLAKE_USER', '')
SNOWFLAKE_PASSWORD: str = os.getenv('SNOWFLAKE_PASSWORD', '')
SNOWFLAKE_PRIVATE_KEY: str = os.getenv('SNOWFLAKE_PRIVATE_KEY', '')
SNOWFLAKE_WAREHOUSE: str = os.getenv('SNOWFLAKE_WAREHOUSE', '')
SNOWFLAKE_DATABASE: str = os.getenv('SNOWFLAKE_DATABASE', 'financial_demo')
SNOWFLAKE_SCHEMA: str = os.getenv('SNOWFLAKE_SCHEMA', 'public')

class Config:
    """Configuration class for the Financial NLQ system"""
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: Optional[str] = AZURE_OPENAI_ENDPOINT
    AZURE_OPENAI_API_KEY: Optional[str] = AZURE_OPENAI_API_KEY
    AZURE_OPENAI_DEPLOYMENT_NAME: str = AZURE_OPENAI_DEPLOYMENT_NAME
    AZURE_OPENAI_API_VERSION: str = AZURE_OPENAI_API_VERSION
    
    # OpenAI Configuration (fallback)
    OPENAI_API_KEY: Optional[str] = os.getenv('OPENAI_API_KEY')
    
    # Snowflake Configuration
    SNOWFLAKE_ACCOUNT: str = SNOWFLAKE_ACCOUNT
    SNOWFLAKE_USER: str = SNOWFLAKE_USER
    SNOWFLAKE_PASSWORD: str = SNOWFLAKE_PASSWORD
    SNOWFLAKE_PRIVATE_KEY: str = SNOWFLAKE_PRIVATE_KEY
    SNOWFLAKE_WAREHOUSE: str = SNOWFLAKE_WAREHOUSE
    SNOWFLAKE_DATABASE: str = SNOWFLAKE_DATABASE
    SNOWFLAKE_SCHEMA: str = SNOWFLAKE_SCHEMA
    
    # Application Configuration
    DEBUG: bool = os.getenv('DEBUG', 'True').lower() == 'true'
    PORT: int = int(os.getenv('PORT', '8000'))
    HOST: str = os.getenv('HOST', '0.0.0.0')
    
    def __init__(self):
        """Initialize configuration and validate required settings"""
        self._validate_config()
    
    def _validate_config(self):
        """Validate configuration and provide warnings for missing credentials"""
        if not self.AZURE_OPENAI_ENDPOINT and not self.OPENAI_API_KEY:
            print("⚠️  Warning: No OpenAI credentials found. Using mock responses.")
            print("   Set AZURE_OPENAI_ENDPOINT + AZURE_OPENAI_API_KEY or OPENAI_API_KEY")
        
        if not self.SNOWFLAKE_ACCOUNT:
            print("⚠️  Warning: No Snowflake credentials found. Using mock data.")
            print("   Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD")
    
    def get_connection_status(self) -> dict:
        """Get the status of configured connections"""
        return {
            'azure_openai': bool(self.AZURE_OPENAI_ENDPOINT and self.AZURE_OPENAI_API_KEY),
            'openai': bool(self.OPENAI_API_KEY),
            'snowflake': bool(self.SNOWFLAKE_ACCOUNT and self.SNOWFLAKE_USER and self.SNOWFLAKE_PASSWORD)
        }