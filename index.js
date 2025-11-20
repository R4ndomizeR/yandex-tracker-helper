// ==UserScript==
// @name         YandexTrackerHelper
// @version      0.1
// @description  Помощник для Yandex Tracker
// @author       R4ndomizeR
// @match        https://tracker.yandex.ru/*
// @icon         https://tracker.yandex.ru/favicon-b2b.ico
// @namespace    https://github.com/R4ndomizeR/yandex-tracker-helper
// @downloadURL  https://raw.githubusercontent.com/R4ndomizeR/yandex-tracker-helper/refs/heads/main/index.js
// @updateURL    https://raw.githubusercontent.com/R4ndomizeR/yandex-tracker-helper/refs/heads/main/index.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

const USER_NAME = 'Вася Пупкин';

function isNegative(number) {
    return !Object.is(Math.abs(number), +number);
}

function leadingZero(number, length = 2) {
    const absNumber = Math.abs(number);
    const numberStr = absNumber.toFixed(0).padStart(length, '0');
    return isNegative(number) ? `-${numberStr}` : numberStr;
}
function hoursToString(hours, options = { seconds: true }) {
    const h = hours < 0 ? Math.ceil(hours) : Math.floor(hours);
    const m = Math.floor(Math.abs((hours * 60) % 3600) / 60);
    const s = Math.floor(Math.abs((hours * 3600) % 60));

    // Если после округления минут получается 60, прибавляем час и обнуляем минуты
    if (m === 60) {
        return `${leadingZero(h + Math.sign(hours))}:00:00`;
    }

    if (options.seconds) {
        return `${leadingZero(h)}:${leadingZero(m)}:${leadingZero(s)}`;
    }

    return `${leadingZero(h)}:${leadingZero(m)}`;
}

/**
 * Копировать текст в буфер обмена
 * @param {string} text
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(success => console.log('Текст скопирован в буфер обмена: ', text))
        .catch(err => console.log('Не удаётся скопировать текст!', err));
}

/**
 * Получить ссылку в markdown формате
 * @param {string} link
 * @param {string} title
 * @returns
 */
function getMarkdownLink(link, title = link) {
    return `[${title}](${link})`;
}

/**
 * Добавить кнопку копирования ссылки на задачу в markdown формате
 * @param {*} target
 * @returns
 */
function addCopyButton(target) {
    // Проверяем, есть ли уже кнопка
    if (target.querySelector('.added-button')) {
        return;
    }

    // Добавляем кнопку
    const button = document.createElement('button');
    button.textContent = 'Copy MD Link';
    button.className = 'added-button';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
        const domain = `https://${window.location.hostname}`;

        const taskNumber = document.querySelector('.page-issue__issue-key a')?.textContent || '';
        const taskName = document.querySelector('.issue-summary__title h1')?.textContent || '';

        const title = `[${taskNumber}]: ${taskName}`;
        const link = `${domain}/${taskNumber}`;

        if (link) {
            const text = getMarkdownLink(link, title);
            copyToClipboard(text);
        }
    });

    target.prepend(button);
}

/**
 * Калькулятор пушей
 * @param {*} target
 * @returns
 */
function addCalculatedTime(target) {
    // Проверяем, есть ли уже кнопка
    if (target.querySelector('.added-time-container')) {
        return;
    }

    const headerElement = target.querySelector('.g-dialog-header');

    // Добавляем контейнер
    const divContainer = document.createElement('div');
    divContainer.className = 'added-time-container';
    divContainer.style.display = 'flex';
    divContainer.style.gap = '10px';
    divContainer.style.margin = '0 30px 0 auto';
    headerElement.append(divContainer);

    // Добавляем кнопку
    const button = document.createElement('button');
    button.textContent = 'CheckTime';
    button.className = 'added-time-button';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
        const rows = target.querySelectorAll('.time-tracking-dialog-body__grid-row');

        let hoursSum = 0;

        rows.forEach((row) => {
            const name = row.querySelector('.g-user__name')?.textContent || '';

            if (name === USER_NAME) {
                const timeString = row.querySelector('.time-tracking-duration-template__info').textContent || '';
                const timeNumber = parseFloat(timeString.replace(/[^\d.-]/g, ''));
                hoursSum += timeNumber;
            }
        });

        const label = target.querySelector('.added-time-label');

        const hoursString = `${hoursSum}`.replace('.', ',');
        const timeString = hoursToString(hoursSum, { seconds: true });

        const labelContent = `${hoursString}ч (${timeString})`;

        if (label) {
            label.textContent = labelContent;
        } else {
            const label = document.createElement('label');
            label.className = 'added-time-label';
            label.textContent = labelContent;
            divContainer.prepend(label);
        }

        copyToClipboard(hoursString);
    });

    divContainer.append(button);
}

/**
 * Проверить узел на наличие селектора и вызвать функцию, передав туда элемент
 * @param {node} node
 * @param {string} selector
 * @param {function} func
 */
function checkNodeAndCallFunction(node, selector, func) {
    // Проверяем сам узел
    if (node.matches(selector)) {
        func(node);
    }

    // И его потомков
    const elements = node.querySelectorAll(selector);
    elements.forEach(el => func(el));
}

/**
 * Инициализация наблюдателя, для добавления дополнительных кнопок
 */
function initMutatuionWatcher() {
    // Создаем наблюдатель
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    checkNodeAndCallFunction(node, '.page-issue__header-top-bar-left', addCopyButton);
                    checkNodeAndCallFunction(node, '.time-tracking-history-dialog__content', addCalculatedTime);
                }
            });
        });
    });

    // Начинаем наблюдение за всем документом
    observer.observe(document.body, {
        childList: true, // наблюдать за непосредственными детьми
        subtree: true, // и всеми потомками
    });
}

(async function () {
    'use strict';

    initMutatuionWatcher();
})();
