// ==UserScript==
// @name         Log Power Clicker
// @namespace    makeappsgreat
// @version      2025-07-25
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
// ==/UserScript==

(function() {
    "use strict";
    console.log("[통나무 파워 자동 클릭] Loaded at", new Date());


    // @match https://chzzk.naver.com/*
    const LOCAL_STORAGE_NAME = "clicker_log";
    const LOG_BUTTON_CLICKED = "Button clicked";
    const CHECK_INTERVAL_MS = 20 * 1000;

    const storage = GM_getValue(LOCAL_STORAGE_NAME, {});
    let uuid = null;
    let name = null;
    let powerLoggedAt = -1;


    function pushLog( details ) {
        if (!storage[uuid]) {
            storage[uuid] = {}
            storage[uuid].name = name;
            storage[uuid].log = [];
        }

        storage[uuid].log.push({time : Date.now(), details : details});
        GM_setValue(LOCAL_STORAGE_NAME, storage);
    }


    // 통나무 파워 자동 클릭
    setInterval(() => {
        const button = document.querySelector("button.live_chatting_power_button__Ov3eJ");
        if (button) {
            button.click();
            console.log(`[통나무 파워 자동 클릭] ${LOG_BUTTON_CLICKED},`, new Date());
            pushLog(LOG_BUTTON_CLICKED);
        }
    }, CHECK_INTERVAL_MS);


    // 프로필 팝업 시, 내 통나무 파워 확인
    const OBSERVER_CONFIG = { childList: true, subtree: true };
    const innerObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                    const target = node.querySelector("button.live_chatting_popup_my_profile_number__kcapw");
                    const now = Date.now();

                    if (target && (now - powerLoggedAt) > (60 * 60 * 1000)) {
                        let power = target.textContent.trim();
                        console.log(`[통나무 파워 자동 클릭] "${name}" 내 통나무 파워 : ${power},`, new Date());
                        pushLog(`내 통나무 파워 : ${power}`);
                        powerLoggedAt = now;
                    }
                }
            });
        });
    });


    const DOWN_D = "M5 6.5L8 9.5L11 6.5";
    const UP_D = "M5 9.5L8 6.5L11 9.5";
    const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains("live_chatting_area__hUPJw")) {
                        observer.disconnect();
                        console.debug("Clicker :: Observer stops observing.", window.location.href);
                        innerObserver.observe(node, OBSERVER_CONFIG);
                        console.debug("Clicker :: InnerObserver starts observing.", window.location.href);

                        // uuid 및 name 재할당
                        uuid = window.location.href.match(/[a-z0-9]{32}/g)[0];
                        name = document.title.split("-")[0].trim();
                        powerLoggedAt = -1;

                        // 로그 보기 버튼 추가
                        const innerLogDiv = document.querySelector("div.footer_button_container__H4Vqs").cloneNode(true);
                        const innerLogButton = innerLogDiv.querySelector("button");
                        innerLogButton.firstChild.textContent = "로그보기";

                        const logDiv = document.createElement("div");
                        logDiv.className = "live_information_box__ATJVO";
                        logDiv.appendChild(innerLogDiv);

                        const information = document.querySelector("div.live_information_area__4ssHl")
                        information.appendChild(logDiv);

                        innerLogButton.addEventListener("click", () => {
                            const path = innerLogButton.querySelector("path")
                            if (path.getAttribute("d") == DOWN_D) {
                                path.setAttribute("d", UP_D);

                                const tableDiv = document.createElement("div");
                                const table = document.createElement("table");
                                tableDiv.className = "live_information_box__ATJVO";


                                storage[uuid]?.log.slice().reverse().forEach((element) => {
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
                                });

                                tableDiv.appendChild(table);
                                information.appendChild(tableDiv);
                            } else {
                                path.setAttribute("d", DOWN_D);
                                if (information.lastElementChild.querySelector("table")) information.removeChild(information.lastElementChild);
                            }
                        });
                    }
                });
            });
    });


    // @match https://game.naver.com/profile
    const profileObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList?.contains("profile_common_container__2Q8-1")) {
                        profileObserver.disconnect();
                        console.debug("Clicker :: ProfileObserver stops observing.", window.location.href);

                        // 자동 클릭한 마지막 ${count}개 파워 확인
                        let count = 100;
                        const wrapper = node.querySelector("div.channel_power_wrapper__1EP27").cloneNode(true);
                        wrapper.querySelector("strong").textContent = `자동 클릭한 마지막 ${count}개 파워 확인`;
                        wrapper.querySelector("p").textContent = '사용자 스크립트 "Log Power Clicker"에 의해 만들어진 영역 입니다.';

                        const powerDiv = document.createElement("div");
                        powerDiv.style.setProperty("margin-top", "30px");
                        powerDiv.textContent = "불러오는 중...";

                        const container = node.cloneNode(false);
                        container.appendChild(wrapper);
                        container.appendChild(powerDiv);

                        node.parentElement.appendChild(container);
                        setTimeout(() => {
                            const listPower = [];

                            Object.keys(storage).forEach(uuid => {
                                const log = storage[uuid].log;
                                log.forEach(log => {
                                   if (log.details === LOG_BUTTON_CLICKED) listPower.push({time : log.time, uuid : uuid});
                                });
                            });
                            listPower.sort((a, b) => b.time - a.time);


                            const table = document.createElement("table");

                            listPower.every(power => {
                                const row = document.createElement("tr");
                                const time = document.createElement("td");
                                const name = document.createElement("td");

                                time.className = "channel_power_item_information__1ulzG";
                                time.style.setProperty("padding", "0.3em 1em");
                                time.style.setProperty("text-align", "right");
                                time.textContent = new Date(power.time);
                                name.style.setProperty("padding", "0.3em 1em");
                                name.appendChild(document.querySelector(`a[href="https://chzzk.naver.com/${power.uuid}"]`).cloneNode(true));

                                row.appendChild(time);
                                row.appendChild(name);
                                table.appendChild(row);

                                if (--count > 0) return true;
                                else return false;
                            });

                            powerDiv.replaceChildren(table);
                        }, 0);
                    }
                });
            });
    });


    // 페이지 이동 시, observer 등록
    function onUrlChange() {
        if (window.location.href.match(/live\/[a-z0-9]{32}/g)) {
            observer.observe(document.body, OBSERVER_CONFIG);
            console.debug("Clicker :: Observer starts observing.", window.location.href);
        } else if (window.location.href.match(/#channel_power/)){
            profileObserver.observe(document.body, OBSERVER_CONFIG);
            console.debug("Clicker :: ProfileObserver starts observing.", window.location.href);
        }
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


    // 사용하고 있는 localStorage 용량 확인
    const k = new Blob([LOCAL_STORAGE_NAME]).size;
    const v = new Blob([JSON.stringify(GM_getValue(LOCAL_STORAGE_NAME, {}))]).size;
    console.debug("Clicker :: Local storage used :", Math.round((k + v) / 1024), "KB");
})();
