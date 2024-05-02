from sqlalchemy import Column, TEXT, INT, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Searchlog(Base):
    __tablename__ = 'searchlog'
    id = Column(INT,nullable=False, primary_key=True)
    drink_id = Column(INT,nullable=False)
    food = Column(TEXT,nullable=False)
    count = Column(INT,nullable=False)