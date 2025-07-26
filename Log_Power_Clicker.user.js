// ==UserScript==
// @name         Log_Power_Clicker
// @namespace    makeappsgreat
// @version      2025-07-25
// @description  치지직 통나무 파워 자동 클릭
// @author       makeappsgreat
// @match        https://chzzk.naver.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chzzk.naver.com
// @grant        none
// ==/UserScript==

(function() {
    "use strict";
    console.log("[통나무 파워 자동 클릭] Loaded at", new Date());


    const LOCAL_STORAGE_NAME = "clicker_log";
    const CHECK_INTERVAL_MS = 20 * 1000;

    const storage = JSON.parse(localStorage.getItem(LOCAL_STORAGE_NAME)) ?? {};
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
        localStorage.setItem(LOCAL_STORAGE_NAME, JSON.stringify(storage));
    }


    // 통나무 파워 자동 클릭
    setInterval(() => {
        const button = document.querySelector("button.live_chatting_power_button__Ov3eJ");
        if (button) {
            button.click();
            console.log("[통나무 파워 자동 클릭] Button clicked,", new Date());
            pushLog("Button clicked");
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


    // 페이지 이동 시, observer 등록
    function onUrlChange() {
        if (window.location.href.match(/live\/[a-z0-9]{32}/g)) {
            observer.observe(document.body, OBSERVER_CONFIG);
            console.debug("Clicker :: Observer starts observing.", window.location.href);
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
    const v = new Blob([localStorage.getItem(LOCAL_STORAGE_NAME)]).size;
    console.debug("Clicker :: Local storage used :", Math.round((k + v) / 1024), "KB");
})();
