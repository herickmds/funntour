from sqlalchemy import Boolean, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    path = Column(String, unique=True, index=True)
    description = Column(String)
    content = Column(Text)
    imageUrl = Column(String, nullable=True)
    authorId = Column(Integer, ForeignKey("users.id"))
    publicationDate = Column(DateTime(timezone=True), nullable=True)
    enabled = Column(Boolean, default=False)
    isDraft = Column(Boolean, default=True)
    isDeleted = Column(Boolean, default=False)
    metaTitle = Column(String, nullable=True)
    metaDescription = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User")

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    content = Column(Text)
    imageUrl = Column(String, nullable=True)
    status = Column(String, default="draft")  # draft, published, archived
    isHomepage = Column(Boolean, default=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    seo = relationship("PageSEO", back_populates="page", uselist=False, cascade="all, delete-orphan")

class PageSEO(Base):
    __tablename__ = "page_seos"

    id = Column(Integer, primary_key=True, index=True)
    pageId = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), unique=True)
    metaTitle = Column(String, nullable=True)
    metaDescription = Column(String, nullable=True)
    ogTitle = Column(String, nullable=True)
    ogDescription = Column(String, nullable=True)
    ogImage = Column(String, nullable=True)
    keywords = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    page = relationship("Page", back_populates="seo")