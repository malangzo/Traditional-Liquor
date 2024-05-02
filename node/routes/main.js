const express = require("express");
const app = express.Router()
const mongoose = require("mongoose")
const async = require('async')
const axios = require('axios');

mongoose.connect("mongodb://192.168.1.56:27017/drink")

// define schema
var drinkSchema = mongoose.Schema({
    ID: Number,
    name: String,
    drinktype: String,
    ingredient: String,
    introduction: String,
    food: String,
    alcohol: String,
    Volume: String,
    pho_url: String
}, {
    versionKey: false
})

// create model with mongodb collection and schema
var Drink = mongoose.model('drinks', drinkSchema);

app.get("/Hello", (req, res) => {
    res.send("Hello World");
});

// list
app.get('/list', function(req, res, next) {
    Drink.find({}, function (err, docs) {
        if (err) console.log('err')
        res.send(docs)
    }).projection({ _id: 0 })
})

// get
app.get('/getdrink', function(req, res, next) {
    var id = req.query.input
    Drink.findOne({'ID': id}, function (err, docs) {
        if (err) console.log('err')
        console.log(docs.ID)
        res.json(docs)
    }).projection({ _id: 0 })
})

app.get('/getdrinkview', async (req, res) => {
    const id = req.query.input;
    try {
        const response = await axios.get(`http://192.168.1.56:3000/get_one_drinks/?ID=${id}`);
        const drinkData = response.data;

      // drinkData 없을 때 에러 처리
        if (!drinkData) {
            console.error('음료 데이터를 찾을 수 없습니다.');
            res.status(404).send('음료 데이터를 찾을 수 없습니다.');
            return;
        }

        // 카카오 지도 HTML 생성
        // const kakaoMapHtml = await getKakaoMapHtml(drinkData);

        const template = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey={kakaojava_apiKey}"></script>
            <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
            <link type="text/css" rel="stylesheet" href="./style.css" />
            <title>전통주 조회</title>
        </head>
        <style>
            .locateMe {
            display: inline-block;
            margin: 5px;
            padding: 8px 12px;
            cursor: pointer;
            }
        </style>
        <body>
        <div class="three">
        <h1>전통주 상세 정보 조회</h1>
        </div>
            <div id="drinks">
                <div class="image-container">
                <img src="https://192.168.1.56:8000/ko_drink/${drinkData.ID}.jpg" alt="${drinkData.name}" style="width:auto; height: 300px;">
                </div>
                <p></p>
                <h2>${drinkData.name}</h2>
                <p><h4>소개</h4> ${drinkData.introduction}</p>
                <table>
                <tbody>
                <tr><td><h4>분류</h4></td><td>${drinkData.drinktype}</td>
                <tr><td><h4>도수</h4></td><td>${drinkData.alcohol}</td>
                <tr><td><h4>용량</h4></td><td>${drinkData.Volume}</td>
                <tr><td><h4>원재료</h4></td><td>${drinkData.ingredient}</td>
                </tbody>
                </table>
            </div>
            <p></p><p></p>
            <div class="three">
            <h1>추천 안주</h1>
            </div>
            <div id="food" class="food">
                <div id="foodButtons">
                    ${drinkData.food.split(',').map((food) => `<button class="locateMe">${food}</button>`).join('')}
                </div>
            </div>
            <p></p><p></p>
            <div class="three">
            <h1>주변 안주 판매점 조회</h1>
            </div>
            <div>
                <div id="map" style="width:50%;height:300px;position:relative;"></div>
                <div class="map_wrap">
                    <div id="menu_wrap" class="bg_white">
                        <ul id="placesList"></ul>
                        <div id="pagination"></div>
                    </div>
                </div>
            </div>
                <script type="text/javascript">
                // 마커를 담을 배열입니다
                var markers = [];

                var mapContainer = document.getElementById('map'),
                    mapOption = {
                        center: new kakao.maps.LatLng(37.563761, 126.98446),
                        level: 3
                    };

                    //지도 생성
                var map = new kakao.maps.Map(mapContainer, mapOption);
                    // 장소 검색 객체 생성
                var places = new kakao.maps.services.Places(map);

                // 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다
                var infowindow = new kakao.maps.InfoWindow({zIndex:1});

                    // 버튼 클릭 시 장소 검색
                document.querySelectorAll('.locateMe').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        // 버튼 class가 locateMe 니까 눌렀을 때 버튼의 값이 키워드 변수로 들어감
                        var keyword = btn.textContent;
                        console.log(keyword)
                        // 키워드 변수 선언한걸 해당 함수에 넣음 
                        getCurrentLocationAndSearch(keyword);
                    });
                });

                document.querySelectorAll('.locateMe').forEach(async function(button) {
                    button.addEventListener('click', async function() {
                        const id = ${drinkData.ID};  // 음료의 ID를 가져옵니다.
                        const food = button.textContent;  // 버튼의 텍스트, 즉 음식명을 가져옵니다.
                        
                        try {
                            // Axios를 사용하여 서버에 GET 요청을 보냅니다.
                            url = 'https://192.168.1.56:3000/logupdate?id='
                            url+= id
                            url+= '&food='
                            url+= food
                            const response = await axios.get(url);
                            console.log(response.data); // 서버에서 받은 응답을 출력합니다.
                        } catch (error) {
                            console.error('오류:', error); // 오류가 발생한 경우 오류를 출력합니다.
                        }
                    });
                });

                // 버튼 누르면 버튼 키워드랑 현재 위치 가져옴 
                function getCurrentLocationAndSearch(keyword) {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function(position) {
                            var lat = position.coords.latitude,
                                lon = position.coords.longitude;
                            var locPosition = new kakao.maps.LatLng(lat, lon);
                            map.setCenter(locPosition);
                            // keyword는 버튼 값
                            // locposition은 내 위치
                            searchPlaces(keyword, locPosition);

                        }, function(err) {
                            console.error('Geolocation error: ' + err.message);
                            alert('현재 위치 정보를 가져오는데 실패했습니다.');
                        });
                    } else {
                        alert('이 브라우저에서는 Geolocation이 지원되지 않습니다.');
                    }
                }

                // 카카오 맵에 키워드랑 위치 넣고 검색
                // 함수 정의 및 검색 요청
                function searchPlaces(keyword, locPosition) {
                    // places.keywordSearch 함수를 호출하고 있으므로 해당 함수를 정의할 필요가 없습니다.
                    places.keywordSearch(keyword, placesSearchCB, { location: locPosition });
                }

                // 장소검색이 완료됐을 때 호출되는 콜백함수
                function placesSearchCB(result, status, pagination) {
                    if (status === kakao.maps.services.Status.OK) {
                        // 정상적으로 검색이 완료됐으면 검색 목록과 마커를 표출합니다
                        displayPlaces(result);

                        // 페이지 번호를 표출합니다
                        displayPagination(pagination);

                    } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                        alert('검색 결과가 없습니다.');
                    } else {
                        alert('검색 중 오류가 발생했습니다.');
                    }
                }

                // 검색 결과 화면에 목록이랑 마커 띄우기 
                function displayPlaces(places) {

                    var listEl = document.getElementById('placesList'), 
                    menuEl = document.getElementById('menu_wrap'),
                    fragment = document.createDocumentFragment(), 
                    bounds = new kakao.maps.LatLngBounds(), 
                    listStr = '';
                    
                    // 검색 결과 목록에 추가된 항목들을 제거합니다
                    removeAllChildNods(listEl);

                    // 지도에 표시되고 있는 마커를 제거합니다
                    removeMarker();
                    
                    for ( var i=0; i<places.length; i++ ) {

                        // 마커를 생성하고 지도에 표시합니다
                        var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
                            marker = addMarker(placePosition, i), 
                            itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다

                        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
                        // LatLngBounds 객체에 좌표를 추가합니다
                        bounds.extend(placePosition);

                        // 마커와 검색결과 항목에 mouseover 했을때
                        // 해당 장소에 인포윈도우에 장소명을 표시합니다
                        // mouseout 했을 때는 인포윈도우를 닫습니다
                        (function(marker, title) {
                            kakao.maps.event.addListener(marker, 'mouseover', function() {
                                displayInfowindow(marker, title);
                            });

                            kakao.maps.event.addListener(marker, 'mouseout', function() {
                                infowindow.close();
                            });

                            itemEl.onmouseover =  function () {
                                displayInfowindow(marker, title);
                            };

                            itemEl.onmouseout =  function () {
                                infowindow.close();
                            };
                        })(marker, places[i].place_name);

                        fragment.appendChild(itemEl);
                    }

                    // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
                    listEl.appendChild(fragment);
                    menuEl.scrollTop = 0;

                    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
                    map.setBounds(bounds);
                }

                function getListItem(index, places) {

                    var el = document.createElement('li'),
                    itemStr = '<span class="markerbg marker_' + (index+1) + '"></span>' +
                                '<div class="info">' +
                                '   <h5>' + places.place_name + '</h5>';

                    if (places.road_address_name) {
                        itemStr += '    <span>' + places.road_address_name + '</span>' +
                                    '   <span class="jibun gray">' +  places.address_name  + '</span>';
                    } else {
                        itemStr += '    <span>' +  places.address_name  + '</span>'; 
                    }
                    
                    itemStr += '  <span class="tel">' + places.phone  + '</span>' +
                                '</div>';           

                    el.innerHTML = itemStr;
                    el.className = 'item';

                    return el;
                }

                // 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
                function addMarker(position, idx, title) {
                    var imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
                        imageSize = new kakao.maps.Size(36, 37),  // 마커 이미지의 크기
                        imgOptions =  {
                            spriteSize : new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
                            spriteOrigin : new kakao.maps.Point(0, (idx*46)+10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
                            offset: new kakao.maps.Point(13, 37) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
                        },
                        markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
                            marker = new kakao.maps.Marker({
                            position: position, // 마커의 위치
                            image: markerImage 
                        });

                    marker.setMap(map); // 지도 위에 마커를 표출합니다
                    markers.push(marker);  // 배열에 생성된 마커를 추가합니다

                    return marker;
                }

                // 지도 위에 표시되고 있는 마커를 모두 제거합니다
                function removeMarker() {
                    for ( var i = 0; i < markers.length; i++ ) {
                        markers[i].setMap(null);
                    }   
                    markers = [];
                }

                // 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
                function displayPagination(pagination) {
                    var paginationEl = document.getElementById('pagination'),
                        fragment = document.createDocumentFragment(),
                        i; 

                    // 기존에 추가된 페이지번호를 삭제합니다
                    while (paginationEl.hasChildNodes()) {
                        paginationEl.removeChild (paginationEl.lastChild);
                    }

                    for (i=1; i<=pagination.last; i++) {
                        var el = document.createElement('a');
                        el.href = "#";
                        el.innerHTML = i;

                        if (i===pagination.current) {
                            el.className = 'on';
                        } else {
                            el.onclick = (function(i) {
                                return function() {
                                    pagination.gotoPage(i);
                                }
                            })(i);
                        }

                        fragment.appendChild(el);
                    }
                    paginationEl.appendChild(fragment);
                }

                // 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
                // 인포윈도우에 장소명을 표시합니다
                function displayInfowindow(marker, title) {
                    var content = '<div style="padding:5px;z-index:1;">' + title + '</div>';

                    infowindow.setContent(content);
                    infowindow.open(map, marker);
                }

                // 검색결과 목록의 자식 Element를 제거하는 함수입니다
                function removeAllChildNods(el) {   
                    while (el.hasChildNodes()) {
                        el.removeChild (el.lastChild);
                    }
                }
                </script>
        </body>
        </html>
        `;

        res.end(template);
    } catch (error) {
        console.error('API 요청 오류:', error);
        res.status(500).send('서버 오류입니다.');
    }
});


module.exports = app;