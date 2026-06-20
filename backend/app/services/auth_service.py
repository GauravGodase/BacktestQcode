from sqlalchemy.orm import Session

from ..auth_utils import hash_password, verify_password
from ..config import get_settings
from ..models import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def create_user(db: Session, email: str, password: str, full_name: str) -> User:
    user = User(
        email=email.lower(),
        full_name=full_name.strip(),
        hashed_password=hash_password(password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def ensure_demo_user(db: Session) -> None:
    settings = get_settings()
    if get_user_by_email(db, settings.demo_email):
        return
    create_user(db, settings.demo_email, settings.demo_password, settings.demo_name)
