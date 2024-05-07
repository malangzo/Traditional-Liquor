from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from bson.objectid import ObjectId
from pymongo import MongoClient
from pydantic import BaseModel
import requests, json, os.path
from database import db_conn
from models import Searchlog

app = FastAPI()

db = db_conn()
session = db.sessionmaker()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.relpath("./")))
secret_file = os.path.join(BASE_DIR, '../secret.json')

with open(secret_file) as f:
    secrets = json.loads(f.read())

def get_secret(setting, secrets=secrets):
    try:
        return secrets[setting]
    except KeyError:
        errorMsg = "Set the {} environment variable.".format(setting)
        return errorMsg

# MongoDB 연결 설정
client = MongoClient("mongodb://192.168.1.56:27017/")

db = client["drink"]  # 데이터베이스 이름
collection = db["drinks"] # 컬렉션 이름

class Drink(BaseModel):
    ID: int
    name: str
    drinktype: str
    ingredient: str
    introduction: str
    food: str
    alcohol: str
    Volume: str
    pho_url: str

# 팀원 http 요청해 받아온 데이터 내 mongoDB에 저장 ---------------------------------------------------

@app.get("/get_one_drinks/")
async def get_one_drinks(ID: str):
    url = "http://192.168.1.29:3000/get_one_drinks/?ID={}".format(ID)
    response = requests.get(url)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")
    
    # 받아온 JSON을 MongoDB에 저장
    data = response.json()
    drink_data = data['drink']

    # MongoDB에 데이터가 있는지 확인
    existing_drink = collection.find_one({"ID": drink_data['ID']})

    # 데이터가 없으면 삽입
    if not existing_drink:
        # 데이터 변환
        drink_doc = {}
        for key, value in drink_data.items():
            drink_doc[key] = value

        # 변환된 문서를 MongoDB에 저장
        collection.insert_one(drink_doc)
        return data['drink']
    else:
        # 데이터가 이미 있으면 그 값 반환
        return drink_data

# ---------------------------------------------------------------------------------------------------

@app.get('/logupdate')
async def logadd(id: int = None, food: str = None):
    record = session.query(Searchlog).filter(Searchlog.drink_id == id, Searchlog.food == food).first()
    if record is None:
        # 레코드가 없으면 새로운 레코드를 생성
        new_record = Searchlog(drink_id=id, food=food, count=1)
        session.add(new_record)
    else: 
        # 레코드가 이미 있으면 COUNT 값을 1 증가
        record.count += 1
    session.commit()
    # 모든 레코드를 반환
    result = session.query(Searchlog).all()
    return {"status": "200",
            "counts" : result }

@app.get("/rank_food")
async def get_rank_food():
    try:
        # count가 높은 대로 보여 줌
        rank = session.query(Searchlog).group_by(id).order_by(desc(Searchlog.count)).all()
        return {"status": "200",
                "rank" : rank }
    finally:
        session.close()

# ---------------------------------------------------------------------------------------------------

# @app.get("/get_location")
# async def get_location(ip_address: str):
#     try:
#         geo_apiKey = get_secret("geo_apiKey")
#         response = requests.get(f'https://geo.ipify.org/api/v1?apiKey={geo_apiKey}&ipAddress={ip_address}')
#         data = response.json()
#         latitude = data['location']['lat']
#         longitude = data['location']['lng']
#         return {
#             "status_code": 200,
#             "ip_address": ip_address,
#             "location": {
#                 "latitude": latitude,
#                 "longitude": longitude
#             }
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
