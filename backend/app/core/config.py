from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev-secret"
    SETUP_SECRET: str = "dev-setup-secret"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
