// LZ78.js - Реализация алгоритма Лемпела-Зива 1978 года
// С динамическим словарём и ограничением размера

function lz78Encode(input, maxDictSize = 256) {
    if (!input || input.length === 0) {
        return { codes: [], dictionary: [""] };
    }

    // Словарь: массив фраз. Индекс 0 — пустая строка
    let dictionary = [""];
    // Максимальный размер словаря (учитываем индекс 0)
    const maxSize = maxDictSize;

    let codes = [];
    let currentPhrase = "";      // Текущая накапливаемая фраза w

    // Проходим по каждому символу входной строки
    for (let i = 0; i < input.length; i++) {
        let symbol = input[i];
        let newPhrase = currentPhrase + symbol;

        // Проверяем, есть ли newPhrase в словаре
        let foundIndex = dictionary.indexOf(newPhrase);

        if (foundIndex !== -1) {
            // Фраза уже есть в словаре - продолжаем накапливать
            currentPhrase = newPhrase;
        } else {
            // Фразы нет в словаре - выдаём код
            let pos = dictionary.indexOf(currentPhrase);
            // currentPhrase всегда есть в словаре (даже если пустая, индекс 0)

            if (symbol === "") {
                codes.push([pos, ""]);
            } else {
                codes.push([pos, symbol]);
            }

            // Добавляем новую фразу в словарь, если есть место
            if (dictionary.length < maxSize) {
                dictionary.push(newPhrase);
            }

            // Сбрасываем текущую фразу, начинаем с пустой
            currentPhrase = "";
        }
    }

    // Обработка остатка (если после цикла есть накопленная фраза)
    if (currentPhrase !== "") {
        let pos = dictionary.indexOf(currentPhrase);
        codes.push([pos, ""]);  // Пустой символ означает "вывести фразу целиком"
    }

    return { codes: codes, dictionary: dictionary };
}

function lz78Decode(codes, maxDictSize = 256) {
    if (!codes || codes.length === 0) {
        return "";
    }

    // Словарь: массив фраз. Индекс 0 — пустая строка
    let dictionary = [""];
    const maxSize = maxDictSize;

    let result = "";

    for (let i = 0; i < codes.length; i++) {
        let [pos, symbol] = codes[i];

        let phrase = "";

        // Проверяем валидность позиции
        if (pos < 0 || pos >= dictionary.length) {
            console.warn(`Некорректная позиция ${pos}, словарь размером ${dictionary.length}`);
            phrase = symbol !== "" ? symbol : "";
        } else {
            phrase = dictionary[pos];
        }

        // Добавляем символ, если он есть
        if (symbol !== "" && symbol !== undefined) {
            phrase += symbol;
        }

        result += phrase;

        // Добавляем фразу в словарь, если есть место
        if (dictionary.length < maxSize && phrase !== "") {
            dictionary.push(phrase);
        }
    }

    return result;
}

function formatCodes(codes) {
    if (!codes || codes.length === 0) {
        return "[]";
    }

    let formatted = codes.map(code => {
        if (code[1] === "" || code[1] === undefined) {
            return `(${code[0]})`;
        } else {
            // Экранируем спецсимволы для отображения
            let symbol = code[1];
            if (symbol === '\n') symbol = '\\n';
            if (symbol === '\t') symbol = '\\t';
            if (symbol === '\r') symbol = '\\r';
            if (symbol === ' ') symbol = '␣';  // пробел показываем наглядно
            return `(${code[0]},'${symbol}')`;
        }
    });

    return "[" + formatted.join(", ") + "]";
}

function calculateCompressionRatio(originalText, codes) {
    // Исходный размер в байтах (UTF-8, считаем 1 байт на символ ASCII/кириллица в этом примере)
    let originalSize = originalText.length;

    // Сжатый размер: каждый код хранит позицию (число) и символ
    // Для простоты оценки: позиция занимает log2(размера_словаря) бит, символ — 8 бит
    // Но для наглядности используем упрощённую метрику
    let compressedSize = 0;
    for (let i = 0; i < codes.length; i++) {
        let [pos, sym] = codes[i];
        // Оцениваем: позиция = 2 байта (для чисел до 65535), символ = 1 байт
        compressedSize += 2;  // за позицию
        if (sym !== "" && sym !== undefined) {
            compressedSize += 1;  // за символ
        }
    }

    let compressionRatio = originalSize > 0 ? (originalSize / compressedSize).toFixed(2) : "0";

    return {
        originalSize: originalSize,
        compressedSize: compressedSize,
        compressionRatio: compressionRatio
    };
}

function lz78EncodeWithSteps(input, maxDictSize = 256) {
    if (!input || input.length === 0) {
        return { steps: [], codes: [], dictionary: [""] };
    }

    let dictionary = [""];
    const maxSize = maxDictSize;
    let codes = [];
    let steps = [];
    let currentPhrase = "";

    for (let i = 0; i < input.length; i++) {
        let symbol = input[i];
        let newPhrase = currentPhrase + symbol;
        let foundIndex = dictionary.indexOf(newPhrase);

        steps.push({
            step: i + 1,
            currentPhrase: currentPhrase === "" ? "∅" : currentPhrase,
            symbol: symbol,
            newPhrase: newPhrase,
            found: foundIndex !== -1,
            foundAt: foundIndex !== -1 ? foundIndex : null,
            action: ""
        });

        if (foundIndex !== -1) {
            currentPhrase = newPhrase;
            steps[steps.length - 1].action = `→ продолжаем, теперь currentPhrase = "${currentPhrase}"`;
        } else {
            let pos = dictionary.indexOf(currentPhrase);
            codes.push([pos, symbol]);
            steps[steps.length - 1].action = `→ выдан код (${pos},'${symbol}')`;
            steps[steps.length - 1].code = `(${pos},'${symbol}')`;

            if (dictionary.length < maxSize) {
                dictionary.push(newPhrase);
                steps[steps.length - 1].addedToDict = `"${newPhrase}" → позиция ${dictionary.length - 1}`;
            } else {
                steps[steps.length - 1].addedToDict = `словарь полон, "${newPhrase}" не добавлена`;
            }
            currentPhrase = "";
        }
    }

    if (currentPhrase !== "") {
        let pos = dictionary.indexOf(currentPhrase);
        codes.push([pos, ""]);
        steps.push({
            step: input.length + 1,
            currentPhrase: currentPhrase,
            symbol: "EOF",
            newPhrase: currentPhrase,
            found: true,
            action: `→ конец строки, выдан код (${pos})`,
            code: `(${pos})`
        });
    }

    return { steps: steps, codes: codes, dictionary: dictionary };
}

if (typeof window !== 'undefined') {
    window.lz78Encode = lz78Encode;
    window.lz78Decode = lz78Decode;
    window.formatCodes = formatCodes;
    window.calculateCompressionRatio = calculateCompressionRatio;
    window.lz78EncodeWithSteps = lz78EncodeWithSteps;
}