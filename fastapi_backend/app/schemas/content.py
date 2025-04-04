from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Esquemas para Article
class ArticleBase(BaseModel):
    title: str
    path: str
    description: str
    content: str
    imageUrl: Optional[str] = None
    authorId: int
    publicationDate: Optional[datetime] = None
    enabled: bool = False
    isDraft: bool = True
    isDeleted: bool = False
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    path: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    imageUrl: Optional[str] = None
    publicationDate: Optional[datetime] = None
    enabled: Optional[bool] = None
    isDraft: Optional[bool] = None
    isDeleted: Optional[bool] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None

class ArticleStatusUpdate(BaseModel):
    field: str  # enabled, isDraft, isDeleted
    value: bool

class Article(ArticleBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class ArticleWithAuthor(Article):
    author: dict  # Dados básicos do autor

# Esquemas para Page
class PageBase(BaseModel):
    title: str
    slug: str
    content: str
    imageUrl: Optional[str] = None
    status: str = "draft"  # draft, published, archived
    isHomepage: bool = False

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    imageUrl: Optional[str] = None
    status: Optional[str] = None
    isHomepage: Optional[bool] = None

class PageStatusUpdate(BaseModel):
    status: str

class Page(PageBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para PageSEO
class PageSEOBase(BaseModel):
    pageId: int
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    ogTitle: Optional[str] = None
    ogDescription: Optional[str] = None
    ogImage: Optional[str] = None
    keywords: Optional[str] = None

class PageSEOCreate(PageSEOBase):
    pass

class PageSEOUpdate(BaseModel):
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    ogTitle: Optional[str] = None
    ogDescription: Optional[str] = None
    ogImage: Optional[str] = None
    keywords: Optional[str] = None

class PageSEO(PageSEOBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class PageWithSEO(Page):
    seo: Optional[PageSEO] = None