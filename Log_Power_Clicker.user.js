// ==UserScript==
// @name         Log Power Clicker
// @namespace    makeappsgreat
// @version      2026-06-18
// @description  치지직 통나무 파워 자동 클릭 사용자 스크립트
// @author       makeappsgreat
// @homepage     https://github.com/makeAppsGreat/Log-Power-Clicker
// @updateURL    https://github.com/makeAppsGreat/Log-Power-Clicker/raw/refs/heads/main/Log_Power_Clicker.user.js
// @downloadURL  https://github.com/makeAppsGreat/Log-Power-Clicker/raw/refs/heads/main/Log_Power_Clicker.user.js
// @match        https://chzzk.naver.com/*
// @match        https://game.naver.com/profile
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chzzk.naver.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// ==/UserScript==

(function() {
    "use strict";
    console.log("[통나무 파워 자동 클릭] Loaded at", new Date());


    const OLD_USERSCRIPT_STORAGE_NAME = "clicker_log";
    const LOG_BUTTON_CLICKED = "Button clicked";
    const CHECK_INTERVAL_MS = 20 * 1000;
    const POWER_STATUS_INTERVAL = 360;

    let gUUID = null;
    let gName = null;
    let gEntry = null;
    let gStatusIntervalId = null;
    let gStatusIntervalLeft = -1;
    let gLastPower = -1;


    function pushLog( details ) {
        gEntry.log.push({time : Date.now(), details : details});
        GM_setValue(gUUID, gEntry);
    }


    // @match https://chzzk.naver.com/*
    // 통나무 파워 자동 클릭
    setInterval(() => {
        const button = document.querySelector("button._button_3fvos_21");
        if (button) {
            button.click();
            console.log(`[통나무 파워 자동 클릭] ${LOG_BUTTON_CLICKED},`, new Date());
            pushLog(LOG_BUTTON_CLICKED);
        }
    }, CHECK_INTERVAL_MS);


    // 통나무 파워 획득 상태 확인
    let powerStatusSpan = null;
    let powerStatus = null;

    function fectchPower ( callback ) {
        fetch(`https://api.chzzk.naver.com/service/v1/channels/${gUUID}/log-power`, {credentials: "include"})
            .then(response => response.json())
            .then(callback);
    }

    function updateIntervalLeft() {
        let innerSpan = powerStatusSpan.querySelector("span");
        if (innerSpan) innerSpan.textContent = `(${gStatusIntervalLeft})`;
    }

    function updatePowerStatus() {
        powerStatusSpan.firstChild.textContent = powerStatus;
        updateIntervalLeft();
    }

    function checkPowerStatus() {
        fectchPower(data => {
            if (data.code === 200) {
                let power = data.content.amount;
                if (gLastPower < 0) {
                    // 최초 실행 시
                    powerStatus = "통나무 파워 획득 확인 예정 ";
                    if (!powerStatusSpan.lastElementChild.querySelector("span")) powerStatusSpan.appendChild(document.createElement("span"));
                    gLastPower = power;
                } else if (gLastPower === power) {
                    // 통나무 파워 획득 정지
                    powerStatus = "통나무 파워 획득 정지 ";
                    if (!powerStatusSpan.lastElementChild.querySelector("span")) powerStatusSpan.appendChild(document.createElement("span"));
                    gLastPower = power;
                } else if ((power - gLastPower) >= 10) {
                    // 통나무 파워 획득 중
                    powerStatus = "통나무 파워 획득 중 ";
                    if (powerStatusSpan.lastElementChild.querySelector("span")) powerStatusSpan.removeChild(powerStatusSpan.lastElementChild);
                    gLastPower = power;
                }
            } else {
                powerStatus = "통나무 파워 확인 실패 ";
                if (!powerStatusSpan.lastElementChild.querySelector("span")) powerStatusSpan.appendChild(document.createElement("span"));
            }

            updatePowerStatus();
        });
    }

    const statusObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === "characterData" && mutation.target.nodeValue.match(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/) && ["_count_1nl77_81", "_count_1ybo4_117"].includes(mutation.target.parentElement.className)) {
                if (--gStatusIntervalLeft % 3 === 0) updateIntervalLeft();
            } else {
                mutation.addedNodes.forEach(node => {
                    let information = null;

                    if (node.classList?.contains("_game_1nl77_48")) information = node.parentElement.querySelector("div._data_1nl77_68"); // 좁은 화면
                    else if (node.classList?.contains("_information_1ybo4_86")) information = node.querySelector("div._view_1ybo4_110"); // 넓은 화면

                    if (information) {
                        powerStatusSpan = information.querySelector("span").cloneNode(false);
                        powerStatusSpan.appendChild(document.createTextNode(""));
                        powerStatusSpan.appendChild(document.createElement("span"));
                        information.appendChild(powerStatusSpan);

                        if (powerStatus) updatePowerStatus();
                    }
                });
            }
        });
    });


    // 로그 버튼
    const DOWN_D = "M5 6.5L8 9.5L11 6.5";
    const UP_D = "M5 9.5L8 6.5L11 9.5";
    function appendLogButton() {
        const innerLogDiv = document.querySelector("div._container_k1gn9_1").cloneNode(true);
        const innerLogButton = innerLogDiv.querySelector("button");
        innerLogButton.firstChild.textContent = "로그보기";

        const logDiv = document.createElement("div");
        logDiv.className = "_box_1qjld_67";
        logDiv.appendChild(innerLogDiv);

        const information = document.querySelector("div._area_1qjld_54");
        information.appendChild(logDiv);

        innerLogButton.addEventListener("click", () => {
            const path = innerLogButton.querySelector("path")
            if (path.getAttribute("d") === DOWN_D) {
                path.setAttribute("d", UP_D);

                const table = document.createElement("table");
                const tableDiv = document.createElement("div");
                table.style.setProperty("margin", "0 auto");
                tableDiv.className = "_box_1qjld_67";
                tableDiv.appendChild(table);
                information.appendChild(tableDiv);

                let count = 48;
                gEntry?.log.slice().reverse().every((element) => {
                    const row = document.createElement("tr");
                    const time = document.createElement("td");
                    const details = document.createElement("td");

                    time.style.setProperty("padding", "0.3em 1em");
                    time.style.setProperty("text-align", "right");
                    time.textContent = new Date(element.time);
                    details.style.setProperty("padding", "0.3em 1em");
                    details.textContent = element.details;

                    row.appendChild(time);
                    row.appendChild(details);
                    table.appendChild(row);

                    if (--count > 0) return true;
                    else return false;
                });
            } else {
                path.setAttribute("d", DOWN_D);
                if (information.lastElementChild.querySelector("table")) information.removeChild(information.lastElementChild);
            }
        });
    }

    const logButtonObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.classList?.contains("_area_1qjld_54")) appendLogButton();
            });
        });
    });


    // 페이지 이동 후, 초기화를 위한 옵저버
    const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains("_area_1qgfi_49")) {
                        observer.disconnect();
                        console.debug("Clicker :: Observer stops observing.", window.location.href);


                        // 글로벌 변수 재할당
                        gUUID = window.location.href.match(/[a-z0-9]{32}/g)[0];
                        gEntry = GM_getValue(gUUID, null);
                        gStatusIntervalLeft = POWER_STATUS_INTERVAL;
                        gLastPower = -1;


                        // 이전버전 호환을 위한 코드
                        // @Before : 2025-08-01
                        if (!gEntry) {
                            const oldStorage = GM_getValue(OLD_USERSCRIPT_STORAGE_NAME, null);

                            if (oldStorage) {
                                Object.keys(oldStorage).forEach(uuid => {
                                    const entry = oldStorage[uuid];

                                    if (entry.lastLiveId === undefined) entry.lastLiveId = -1;
                                    GM_setValue(uuid, entry);
                                });
                            } else {
                                gEntry = {name : null, lastLiveId : -1, log : []};
                                GM_setValue(gUUID, gEntry);
                            }
                        } else {
                            if (gEntry.lastLiveId === undefined) gEntry.lastLiveId = -1;
                        }


                        // 새로운 라이브면 내 통나무 파워 저장
                        fetch(`https://api.chzzk.naver.com/service/v3.2/channels/${gUUID}/live-detail`)
                            .then(response => response.json())
                            .then(data => {
                            if (data.code === 200) {
                                gName = data.content.channel.channelName;

                                if (gEntry.lastLiveId !== data.content.liveId) {
                                    gEntry.lastLiveId = data.content.liveId;
                                    fectchPower(powerData => {
                                        if (powerData.code === 200) {
                                            console.log(`[통나무 파워 자동 클릭] "${gName}" 내 통나무 파워 : ${powerData.content.amount},`, new Date());
                                            pushLog(`내 통나무 파워 : ${powerData.content.amount}`);
                                        } else console.error("[통나무 파워 자동 클릭] 내 통나무 파워 확인 실패,", new Date());
                                    });
                                }
                            } else console.error("[통나무 파워 자동 클릭] 라이브 상세 정보 확인 실패,", new Date());
                        });


                        // 통나무 파워 획득 상태 확인 시작
                        if (gStatusIntervalId) clearInterval(gStatusIntervalId);
                        gStatusIntervalId = setInterval(() => {
                            gStatusIntervalLeft = POWER_STATUS_INTERVAL;
                            checkPowerStatus();
                        }, POWER_STATUS_INTERVAL * 1000);
                        checkPowerStatus();

                        // 로그 버튼 추가
                        appendLogButton();
                    }
                });
            });
    });


    // @match https://game.naver.com/profile
    const profileObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains("_container_x6duu_73")) {
                        profileObserver.disconnect();
                        console.debug("Clicker :: The profile observer stops observing.", window.location.href);

                        // 자동 클릭한 마지막 ${count}개 파워 확인
                        let count = 100;
                        const wrapper = node.querySelector("div._wrapper_xg8tv_2").cloneNode(true);
                        wrapper.querySelector("strong").textContent = `자동 클릭한 마지막 ${count}개 파워 확인`;
                        wrapper.querySelector("p").textContent = '사용자 스크립트 "Log Power Clicker"에 의해 만들어진 영역 입니다.';

                        const powerDiv = document.createElement("div");
                        powerDiv.style.setProperty("margin-top", "30px");
                        powerDiv.textContent = "불러오는 중...";

                        const container = node.cloneNode(false);
                        container.id = "power_log_container";
                        container.appendChild(wrapper);
                        container.appendChild(powerDiv);
                        node.parentElement.appendChild(container);

                        setTimeout(() => {
                            const keys = GM_listValues();
                            const listPower = [];
                            const ol = document.createElement("ol");

                            keys.splice(keys.findIndex(item => item === OLD_USERSCRIPT_STORAGE_NAME), 1);
                            keys.forEach(uuid => {
                                const log = GM_getValue(uuid, null).log;
                                log.forEach(log => {
                                   if (log.details === LOG_BUTTON_CLICKED) listPower.push({time : log.time, uuid : uuid});
                                });
                            });
                            listPower.sort((a, b) => b.time - a.time);
                            listPower.every(power => {
                                const row = document.createElement("li");
                                const time = document.createElement("div");
                                const name = document.createElement("a");

                                time.className = "_power_10ddf_34";
                                time.style.setProperty("padding", "0.3em 1em");
                                time.style.setProperty("text-align", "right");
                                time.textContent = new Date(power.time);
                                name.className = "_link_10ddf_1";
                                name.style.setProperty("padding", "0.3em 1em");
                                name.appendChild(document.querySelector(`a[href="https://chzzk.naver.com/${power.uuid}"]`).cloneNode(true));

                                row.className = "_item_xg8tv_26";
                                row.appendChild(time);
                                row.appendChild(name);
                                ol.appendChild(row);

                                if (--count > 0) return true;
                                else return false;
                            });

                            powerDiv.replaceChildren(ol);
                        }, 0);
                    }
                });
            });
    });


    // 페이지 이동 시, observer 등록
    const DEFAULT_OBSERVER_CONFIG = { childList: true, subtree: true };
    function onUrlChange() {
        if (window.location.href.match(/live\/[a-z0-9]{32}/g)) {
            observer.observe(document.body, DEFAULT_OBSERVER_CONFIG);
            console.debug("Clicker :: The observer starts observing.", window.location.href);
            statusObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
            console.debug("Clicker :: The status observer starts observing.", window.location.href);
            logButtonObserver.observe(document.body, DEFAULT_OBSERVER_CONFIG);
            console.debug("Clicker :: The log button observer starts observing.", window.location.href);
        } else if (window.location.href.match(/#channel_power/)){
            profileObserver.observe(document.body, DEFAULT_OBSERVER_CONFIG);
            console.debug("Clicker :: The profile observer starts observing.", window.location.href);
        } else if (window.location.href.match(/game.naver.com\/profile/)) document.getElementById("power_log_container")?.remove();
    }

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
        originalPushState.apply(this, arguments);
        onUrlChange();
    };

    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        onUrlChange();
    };

    window.addEventListener('popstate', onUrlChange);
    onUrlChange();


    // 사용하고 있는 Userscript storage 사용량 확인
    let k = 0, v = 0;
    GM_listValues().forEach(key => {
        k += new Blob([key]).size;
        v += new Blob([JSON.stringify(GM_getValue(key, null))]).size;
    });
    console.debug("Clicker :: User script storage usage :", Math.round((k + v) / 1024), "KB");
})();
