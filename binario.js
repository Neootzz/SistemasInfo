"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const categorySelect = $("#category");
  const subtractionMethodSelect = $("#subtractionMethod");
  const subtractionMethodControl = $("#subtractionMethodControl");
  const logicOperationSelect = $("#logicOperation");
  const logicOperationControl = $("#logicOperationControl");
  const bitLengthSelect = $("#bitLength");
  const generateButton = $("#generateBtn");
  const checkButton = $("#checkBtn");
  const answerInput = $("#answerInput");
  const exerciseType = $("#exerciseType");
  const exerciseCounter = $("#exerciseCounter");
  const exerciseTitle = $("#exerciseTitle");
  const problemBox = $("#problemBox");
  const bitPositionPanel = $("#bitPositionPanel");
  const exerciseCheat = $("#exerciseCheat");
  const exerciseCheatTitle = $("#exerciseCheatTitle");
  const exerciseCheatContent = $("#exerciseCheatContent");
  const feedback = $("#feedback");
  const solution = $("#solution");
  const exerciseTip = $("#exerciseTip");

  let currentExercise = null;
  let exerciseNumber = 0;

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomBits = (width) => Array.from({ length: width }, () => (Math.random() < 0.5 ? "0" : "1")).join("");
  const toBits = (number, width) => number.toString(2).padStart(width, "0");
  const binaryValue = (bits) => parseInt(bits, 2);
  const formatDecimal = (number) => Number(number.toFixed(8)).toString().replace(".", ",");

  function cleanInput(value) {
    return value.trim()
      .replace(/[₂₁₀]/g, "")
      .replace(/\s+/g, "")
      .replace(/[‐‑‒–—−]/g, "-")
      .replace(",", ".");
  }

  function cleanBinary(value) {
    return cleanInput(value).replace(/_/g, "").replace(/^0+(?=[01])/, "");
  }

  function binaryFractionToDecimal(bits) {
    const parts = bits.replace(",", ".").split(".");
    const integer = parseInt(parts[0] || "0", 2);
    const fraction = (parts[1] || "").split("").reduce((sum, bit, index) => {
      return sum + (bit === "1" ? Math.pow(2, -(index + 1)) : 0);
    }, 0);
    return integer + fraction;
  }

  function decimalFractionToBinary(value, maxPlaces = 8) {
    const parts = String(value).replace(",", ".").split(".");
    let integer = Number(parts[0]);
    let fraction = Number("0." + (parts[1] || "0"));
    let whole = integer.toString(2);
    let fractional = "";
    for (let i = 0; i < maxPlaces && fraction > 0.000000001; i += 1) {
      fraction *= 2;
      if (fraction >= 1) {
        fractional += "1";
        fraction -= 1;
      } else {
        fractional += "0";
      }
    }
    fractional = fractional.replace(/0+$/, "");
    return fractional ? whole + "," + fractional : whole;
  }

  function addBinary(a, b, width) {
    const sum = binaryValue(a) + binaryValue(b);
    return {
      bits: sum.toString(2).padStart(width + (sum >= Math.pow(2, width) ? 1 : 0), "0"),
      decimal: sum
    };
  }

  function complementSubtract(a, b, width, method) {
    const mask = Math.pow(2, width) - 1;
    let rawSum;
    let finalBits;
    let explanation;

    if (method === "C1") {
      const inverse = toBits(mask ^ binaryValue(b), width);
      rawSum = binaryValue(a) + binaryValue(inverse);
      if (rawSum >= Math.pow(2, width)) {
        finalBits = toBits((rawSum & mask) + 1, width);
        explanation = "C1 de B: " + inverse + ". Suma A + C1(B) = " + rawSum.toString(2) +
          " (acarreo final). Reincorpora el acarreo: resultado " + finalBits + ".";
      } else {
        finalBits = toBits(rawSum, width);
        explanation = "C1 de B: " + inverse + ". Suma A + C1(B) = " + finalBits +
          " sin acarreo final. El resultado es negativo; invierte " + finalBits +
          " para obtener su magnitud.";
      }
    } else {
      const inverse = toBits(mask ^ binaryValue(b), width);
      const c2 = toBits((binaryValue(inverse) + 1) & mask, width);
      rawSum = binaryValue(a) + binaryValue(c2);
      finalBits = toBits(rawSum & mask, width);
      explanation = "C1 de B: " + inverse + "; suma 1 para obtener C2(B) = " + c2 +
        ". Suma A + C2(B) y descarta el acarreo final: resultado " + finalBits + ".";
    }

    const resultValue = binaryValue(a) - binaryValue(b);
    const signedMeaning = resultValue < 0 ? resultValue : resultValue;
    return { bits: finalBits, value: signedMeaning, explanation };
  }

  function pickType(category) {
    if (category !== "mixed") return category;
    const options = ["conversion", "fraction", "addition", "subtraction", "logic", "parity"];
    return options[randomInt(0, options.length - 1)];
  }

  function makeExercise() {
    const width = Number(bitLengthSelect.value);
    const category = pickType(categorySelect.value);

    if (category === "conversion") {
      const binaryToDecimal = Math.random() < 0.5;
      if (binaryToDecimal) {
        const bits = randomBits(width);
        return {
          type: "CONVERSIÓN · BINARIO A DECIMAL",
          title: "Pasa este número a decimal",
          problem: bits + "₂ = ?₁₀",
          answer: String(binaryValue(bits)),
          bitPanel: { bits, width },
          cheatType: "conversion",
          mode: "decimal",
          explanation: bits.split("").reverse().map((bit, index) => bit + " × 2^" + index).reverse().join(" + ") +
            " = " + binaryValue(bits) + ".",
          tip: "Empieza por la derecha: la primera posición vale 2⁰ = 1."
        };
      }
      const value = randomInt(1, Math.pow(2, width) - 1);
      return {
        type: "CONVERSIÓN · DECIMAL A BINARIO",
        title: "Pasa este número a binario",
        problem: value + "₁₀ = ?₂",
        answer: value.toString(2),
        bitPanel: { bits: null, width },
        cheatType: "conversion",
        mode: "binary",
        explanation: value + " ÷ 2 con divisiones sucesivas; lee los restos desde el último hasta el primero: " + value.toString(2) + ".",
        tip: "Divide entre 2; lee los restos de abajo hacia arriba. No hace falta añadir ceros iniciales."
      };
    }

    if (category === "fraction") {
      if (Math.random() < 0.5) {
        const whole = randomInt(0, Math.min(12, Math.pow(2, width) - 1));
        const places = randomInt(1, 4);
        const fractionBits = randomBits(places);
        const binary = whole.toString(2) + "," + fractionBits;
        const result = binaryFractionToDecimal(binary);
        return {
          type: "FRACCIÓN · BINARIO A DECIMAL",
          title: "Convierte la parte fraccionaria",
          problem: binary + "₂ = ?₁₀",
          answer: String(result),
          mode: "decimal",
          tolerance: 0.000001,
          bitPanel: { integerBits: whole.toString(2), width, fractionBits, fractionWidth: places },
          cheatType: "fraction",
          explanation: binary.split(",")[0] + "₂ = " + parseInt(whole.toString(2), 2) +
            "; " + fractionBits.split("").map((bit, index) => bit + " × 2^−" + (index + 1)).join(" + ") +
            ". Total: " + formatDecimal(result) + ".",
          tip: "A la derecha de la coma: 2⁻¹ = 0,5; 2⁻² = 0,25; 2⁻³ = 0,125…"
        };
      }
      const whole = randomInt(0, Math.min(12, Math.pow(2, width) - 1));
      const fraction = randomInt(1, 15) / 16;
      const value = whole + fraction;
      const result = decimalFractionToBinary(value, 8);
      return {
        type: "FRACCIÓN · DECIMAL A BINARIO",
        title: "Convierte este decimal a binario",
        problem: formatDecimal(value) + "₁₀ = ?₂",
        answer: result,
        mode: "binary",
        bitPanel: { integerBits: null, width, fractionBits: null, fractionWidth: 4 },
        cheatType: "fraction",
        explanation: "Convierte la parte entera por divisiones sucesivas. Multiplica la fracción por 2 y toma cada parte entera en orden. Resultado: " + result + "₂.",
        tip: "Multiplica la fracción por 2 repetidamente. Lee las partes enteras en el orden en que aparecen."
      };
    }

    if (category === "arithmetic" || category === "addition") {
      const a = randomInt(0, Math.pow(2, width) - 1);
      const b = randomInt(0, Math.pow(2, width) - 1);
      const bitsA = toBits(a, width);
      const bitsB = toBits(b, width);
      const isAddition = category === "addition" ? true : category === "subtraction" ? false : Math.random() < 0.5;
      if (isAddition) {
        const result = addBinary(bitsA, bitsB, width);
        return {
          type: "ARITMÉTICA · SUMA BINARIA",
          title: "Suma las dos secuencias",
          problem: bitsA + "₂ + " + bitsB + "₂ = ?₂",
          answer: result.bits,
          mode: "binary",
          cheatType: "addition",
          explanation: a + " + " + b + " = " + result.decimal + ". En binario, " + result.bits + ". El acarreo puede añadir un bit.",
          tip: "En cada columna, 1 + 1 = 10: escribe 0 y acarrea 1."
        };
      }
      const minuend = Math.random() < 0.5 ? a : b;
      const subtrahend = minuend === a ? b : a;
      const diff = minuend - subtrahend;
      const resultBits = diff < 0 ? "-" + Math.abs(diff).toString(2) : diff.toString(2);
      return {
        type: "ARITMÉTICA · RESTA BINARIA",
        title: "Resuelve la resta directa",
        problem: toBits(minuend, width) + "₂ − " + toBits(subtrahend, width) + "₂ = ?₂",
        answer: resultBits,
        mode: "binary",
        cheatType: "subtraction",
        explanation: minuend + " − " + subtrahend + " = " + diff + ". " +
          (diff < 0 ? "Escribe el signo menos y convierte la magnitud " + Math.abs(diff) + " a binario." :
            "Comprueba el resultado convirtiéndolo a decimal: " + resultBits + "₂ = " + diff + "."),
        tip: "Si el minuendo es menor, expresa el resultado con signo negativo y convierte su magnitud."
      };
    }

    if (category === "subtraction" || category === "complement" || category === "complement1" || category === "complement2") {
      const a = randomInt(0, Math.pow(2, width) - 1);
      const b = randomInt(0, Math.pow(2, width) - 1);
      const method = category === "subtraction" ? subtractionMethodSelect.value :
        category === "complement1" ? "C1" : category === "complement2" ? "C2" :
          Math.random() < 0.5 ? "C1" : "C2";

      if (method === "normal") {
        const minuend = Math.random() < 0.5 ? a : b;
        const subtrahend = minuend === a ? b : a;
        const difference = minuend - subtrahend;
        const answer = difference < 0 ? "-" + Math.abs(difference).toString(2) : difference.toString(2);
        return {
          type: "ARITMÉTICA · RESTA NORMAL",
          title: "Resuelve la resta binaria",
          problem: toBits(minuend, width) + "₂ − " + toBits(subtrahend, width) + "₂ = ?₂",
          answer,
          mode: "binary",
          cheatType: "subtraction",
          explanation: minuend + " − " + subtrahend + " = " + difference + ". " +
            (difference < 0 ? "El resultado es negativo; convierte la magnitud " + Math.abs(difference) + " a binario y escribe el signo menos." :
              "El resultado decimal " + difference + " escrito en binario es " + answer + "."),
          tip: "Resta desde la derecha. Si aparece 0 − 1, pide prestado a una columna de la izquierda."
        };
      }

      const result = complementSubtract(toBits(a, width), toBits(b, width), width, method);
      return {
        type: "RESTA · " + (method === "C1" ? "COMPLEMENTO A 1" : "COMPLEMENTO A 2"),
        title: "Resta usando " + (method === "C1" ? "complemento a 1" : "complemento a 2"),
        problem: toBits(a, width) + "₂ − " + toBits(b, width) + "₂ = ?₂ (" + width + " bits)",
        answer: result.bits,
        mode: "binary",
        cheatType: method,
        explanation: result.explanation + " Valor decimal: " + result.value + ".",
        tip: method === "C1" ? "Invierte los bits del sustraendo; si sobra un acarreo por la izquierda, súmalo a la derecha." : "Invierte el sustraendo, suma 1 y descarta el acarreo final."
      };
    }
    if (category === "parity") {
      const parityMode = Math.random() < 0.5 ? "even" : "odd";
      const modeLabel = parityMode === "even" ? "paridad par" : "paridad impar";
      const verify = Math.random() < 0.5;
      if (!verify) {
        const bits = randomBits(width);
        const ones = bits.split("").filter((bit) => bit === "1").length;
        const parityBit = parityMode === "even" ? String(ones % 2) : String((ones + 1) % 2);
        return {
          type: "PARIDAD · " + modeLabel.toUpperCase(),
          title: "Calcula el bit de " + modeLabel,
          problem: "Añade el bit de " + modeLabel + " a " + bits + "₂. ¿Qué bit falta?",
          answer: parityBit,
          mode: "binary",
          cheatType: "parity",
          parityMode,
          parityTask: "create",
          explanation: "La secuencia tiene " + ones + " unos. " +
            (parityMode === "even" ? "Para que el total sea par, " : "Para que el total sea impar, ") +
            "el bit que falta es " + parityBit + ".",
          tip: "Cuenta los unos de la secuencia. El bit añadido debe dejar el total par o impar, según indique el ejercicio."
        };
      }

      const bits = randomBits(width + 1);
      const ones = bits.split("").filter((bit) => bit === "1").length;
      const valid = parityMode === "even" ? ones % 2 === 0 : ones % 2 === 1;
      return {
        type: "PARIDAD · COMPROBACIÓN " + modeLabel.toUpperCase(),
        title: "Comprueba la paridad",
        problem: "¿La secuencia " + bits + "₂ cumple " + modeLabel + "? Responde sí o no.",
        answer: valid ? "sí" : "no",
        mode: "text",
        cheatType: "parity",
        parityMode,
        parityTask: "check",
        explanation: "La secuencia contiene " + ones + " unos, así que su total es " +
          (ones % 2 === 0 ? "par" : "impar") + ". " +
          (valid ? "Sí cumple " + modeLabel + "." : "No cumple " + modeLabel + "."),
        tip: "Cuenta todos los unos, incluido el bit de paridad que ya forma parte de la secuencia."
      };
    }
    const operations = ["AND", "OR", "NAND", "NOR", "XOR", "NOT"];
    const op = category === "logic" ? logicOperationSelect.value : operations[randomInt(0, operations.length - 1)];
    const a = randomBits(width);
    const b = randomBits(width);
    const result = a.split("").map((bit, index) => {
      const left = bit === "1";
      if (op === "NOT") return left ? "0" : "1";
      const right = b[index] === "1";
      let output;
      if (op === "AND" || op === "NAND") output = left && right;
      if (op === "OR" || op === "NOR") output = left || right;
      if (op === "XOR") output = left !== right;
      if (op === "NAND" || op === "NOR") output = !output;
      return output ? "1" : "0";
    }).join("");
    return {
      type: "LÓGICA · PUERTA " + op,
      title: "Opera bit a bit con " + op,
      problem: op === "NOT" ? "NOT " + a + "₂ = ?₂" : a + "₂ " + op + " " + b + "₂ = ?₂",
      answer: result,
      mode: "binary",
      cheatType: "logic",
      logicOperation: op,
      explanation: op === "NOT" ? "NOT invierte cada bit: " + a + " → " + result + "." :
        "Compara las parejas en cada posición según la tabla de " + op + ": " + result + ".",
      tip: op === "XOR" ? "XOR vale 1 cuando los bits de esa columna son distintos." :
        op === "NAND" || op === "NOR" ? op + " invierte el resultado de " + (op === "NAND" ? "AND" : "OR") + "." :
          op === "AND" ? "AND solo vale 1 cuando ambos bits de la posición valen 1." :
            op === "OR" ? "OR vale 1 si al menos uno de los dos bits vale 1." : "NOT cambia cada 0 por 1 y cada 1 por 0."
    };
  }

  function renderBitPositionPanel(panel) {
    bitPositionPanel.replaceChildren();
    bitPositionPanel.hidden = !panel;
    if (!panel) return;

    const heading = document.createElement("div");
    heading.className = "bit-panel-heading";
    heading.innerHTML = "<span>CHULETA DE POSICIONES</span><span>bit · potencia de 2 · valor decimal</span>";
    bitPositionPanel.appendChild(heading);

    const fractional = panel.fractionWidth !== undefined;
    const fractionWidth = fractional ? panel.fractionWidth : 0;
    const columnCount = panel.width + (fractional ? fractionWidth + 1 : 0);
    const grid = document.createElement("div");
    grid.className = "bit-position-grid";
    grid.style.gridTemplateColumns = "repeat(" + panel.width + ", minmax(42px, 1fr))" +
      (fractional ? " 12px repeat(" + fractionWidth + ", minmax(42px, 1fr))" : "");
    grid.setAttribute("aria-colcount", String(columnCount));

    const integerBits = panel.integerBits !== undefined ? panel.integerBits : panel.bits;
    const integerDisplay = integerBits === null ? null : String(integerBits).padStart(panel.width, "0").slice(-panel.width);

    function appendCell(bit, exponent) {
      const card = document.createElement("div");
      card.className = "bit-position-card";
      card.setAttribute("role", "listitem");
      card.setAttribute("aria-label", "Bit " + (bit === null ? "por resolver" : bit) +
        ", potencia 2 elevado a " + exponent + ", peso " + formatDecimal(Math.pow(2, exponent)));

      const bitValue = document.createElement("strong");
      bitValue.className = "position-bit";
      bitValue.textContent = bit === null ? "?" : bit;

      const power = document.createElement("span");
      power.className = "position-power";
      power.append("2");
      const superscript = document.createElement("sup");
      superscript.textContent = String(exponent);
      power.appendChild(superscript);

      const weight = document.createElement("span");
      weight.className = "position-value";
      weight.textContent = formatDecimal(Math.pow(2, exponent));

      card.append(bitValue, power, weight);
      grid.appendChild(card);
    }

    for (let index = 0; index < panel.width; index += 1) {
      appendCell(integerDisplay === null ? null : integerDisplay[index], panel.width - index - 1);
    }

    if (fractional) {
      const separator = document.createElement("span");
      separator.className = "bit-separator";
      separator.textContent = ",";
      separator.setAttribute("aria-hidden", "true");
      grid.appendChild(separator);
      for (let index = 0; index < fractionWidth; index += 1) {
        const bit = panel.fractionBits === null ? null : panel.fractionBits[index];
        appendCell(bit === undefined ? "0" : bit, -(index + 1));
      }
    }

    bitPositionPanel.appendChild(grid);
  }

  function appendCheatParagraph(container, text) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    container.appendChild(paragraph);
  }

  function appendCheatTable(container, headers, rows) {
    const table = document.createElement("table");
    table.className = "cheat-rule-table";
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach((label) => {
      const cell = document.createElement("th");
      cell.textContent = label;
      headerRow.appendChild(cell);
    });
    head.appendChild(headerRow);
    table.appendChild(head);

    const body = document.createElement("tbody");
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    container.appendChild(table);
  }

  function renderExerciseCheat(exercise) {
    exerciseCheat.hidden = false;
    exerciseCheatContent.replaceChildren();

    if (exercise.cheatType === "conversion") {
      exerciseCheatTitle.textContent = "Chuleta · conversión de enteros";
      appendCheatParagraph(exerciseCheatContent, "Multiplica cada bit por el peso indicado en el panel y suma los productos. Para decimal a binario, divide entre 2 y lee los restos desde abajo.");
      return;
    }

    if (exercise.cheatType === "fraction") {
      exerciseCheatTitle.textContent = "Chuleta · conversión de fracciones";
      appendCheatParagraph(exerciseCheatContent, "A la izquierda de la coma, las posiciones valen 2⁰, 2¹, 2²… A la derecha valen 2⁻¹ = 0,5; 2⁻² = 0,25; 2⁻³ = 0,125… El panel muestra cada peso.");
      appendCheatParagraph(exerciseCheatContent, "De decimal a binario: convierte la parte entera dividiendo entre 2. Multiplica la fracción por 2 y anota cada parte entera en orden.");
      return;
    }

    if (exercise.cheatType === "addition") {
      exerciseCheatTitle.textContent = "Chuleta · suma binaria";
      appendCheatTable(exerciseCheatContent, ["Operación", "Escribe", "Acarreo"], [
        ["0 + 0", "0", "0"], ["0 + 1", "1", "0"], ["1 + 0", "1", "0"],
        ["1 + 1", "0", "1"], ["1 + 1 + 1", "1", "1"]
      ]);
      appendCheatParagraph(exerciseCheatContent, "Suma columna a columna de derecha a izquierda. Añade el acarreo a la columna siguiente.");
      return;
    }

    if (exercise.cheatType === "subtraction") {
      exerciseCheatTitle.textContent = "Chuleta · resta binaria directa";
      appendCheatTable(exerciseCheatContent, ["Operación", "Resultado"], [
        ["0 − 0", "0"], ["1 − 0", "1"], ["1 − 1", "0"], ["0 − 1", "1 y pide 1 prestado"]
      ]);
      appendCheatParagraph(exerciseCheatContent, "Al pedir prestado, el 0 de esa columna pasa a valer 10₂. Entonces 10₂ − 1₂ = 1₂.");
      return;
    }

    if (exercise.cheatType === "C1") {
      exerciseCheatTitle.textContent = "Chuleta · complemento a 1";
      appendCheatParagraph(exerciseCheatContent, "1. Invierte todos los bits del sustraendo. 2. Súmalo al minuendo. 3. Si aparece un acarreo final, vuelve a sumarlo al resultado (acarreo recurrente).");
      return;
    }

    if (exercise.cheatType === "C2") {
      exerciseCheatTitle.textContent = "Chuleta · complemento a 2";
      appendCheatParagraph(exerciseCheatContent, "1. Invierte todos los bits del sustraendo. 2. Súmale 1. 3. Súmalo al minuendo y descarta el acarreo final.");
      return;
    }

    if (exercise.cheatType === "parity") {
      exerciseCheatTitle.textContent = "Chuleta · paridad par e impar";
      appendCheatTable(exerciseCheatContent, ["Tipo", "Regla"], [
        ["Par", "El total de unos debe ser múltiplo de 2"],
        ["Impar", "El total de unos debe dejar resto 1 al dividir entre 2"]
      ]);
      appendCheatParagraph(exerciseCheatContent, "Cuenta los bits que valen 1, incluido el bit de paridad cuando la secuencia ya lo contiene. Si falta el bit, elige 0 o 1 para que el total cumpla la regla.");
      return;
    }

    if (exercise.cheatType === "logic") {
      const op = exercise.logicOperation;
      exerciseCheatTitle.textContent = "Chuleta · puerta " + op;
      if (op === "NOT") {
        appendCheatTable(exerciseCheatContent, ["Entrada", "NOT"], [["0", "1"], ["1", "0"]]);
        appendCheatParagraph(exerciseCheatContent, "NOT invierte cada bit de la secuencia.");
        return;
      }
      const outputs = {
        AND: ["0", "0", "0", "1"],
        OR: ["0", "1", "1", "1"],
        NAND: ["1", "1", "1", "0"],
        NOR: ["1", "0", "0", "0"],
        XOR: ["0", "1", "1", "0"]
      };
      appendCheatTable(exerciseCheatContent, ["A", "B", op], [
        ["0", "0", outputs[op][0]], ["0", "1", outputs[op][1]],
        ["1", "0", outputs[op][2]], ["1", "1", outputs[op][3]]
      ]);
      const descriptions = {
        AND: "Solo devuelve 1 si ambos bits son 1.",
        OR: "Devuelve 1 si al menos uno de los bits es 1.",
        NAND: "Invierte la salida de AND.",
        NOR: "Invierte la salida de OR.",
        XOR: "Devuelve 1 si los bits son distintos."
      };
      appendCheatParagraph(exerciseCheatContent, descriptions[op]);
    }
  }
  function initializePickers() {
    document.querySelectorAll("[data-picker]").forEach((picker) => {
      const trigger = picker.querySelector(".picker-trigger");
      const menu = picker.querySelector(".picker-menu");
      const nativeSelect = picker.querySelector(".picker-native");
      const currentLabel = picker.querySelector(".picker-current");
      const options = Array.from(picker.querySelectorAll(".picker-option"));
      let menuAnimation = null;

      function closeMenu(restoreFocus = false) {
        if (menu.hidden || trigger.getAttribute("aria-expanded") === "false") return;
        trigger.setAttribute("aria-expanded", "false");
        picker.classList.remove("is-open");
        if (menuAnimation) menuAnimation.cancel();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          menuAnimation = menu.animate(
            [{ opacity: 1, transform: "translateY(0) scaleY(1)" }, { opacity: 0, transform: "translateY(-5px) scaleY(.97)" }],
            { duration: 170, easing: "cubic-bezier(.4,0,.8,.2)" }
          );
          menuAnimation.onfinish = () => {
            if (trigger.getAttribute("aria-expanded") === "false") menu.hidden = true;
            menuAnimation = null;
          };
        } else {
          menu.hidden = true;
        }
        if (restoreFocus) trigger.focus();
      }

      function openMenu() {
        if (trigger.getAttribute("aria-expanded") === "true") return;
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        picker.classList.add("is-open");
        if (menuAnimation) menuAnimation.cancel();
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          menuAnimation = menu.animate(
            [{ opacity: 0, transform: "translateY(-6px) scaleY(.96)" }, { opacity: 1, transform: "translateY(0) scaleY(1)" }],
            { duration: 210, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        }
        const selected = options.find((option) => option.dataset.value === nativeSelect.value);
        (selected || options[0]).focus();
      }

      trigger.addEventListener("click", () => {
        if (trigger.getAttribute("aria-expanded") === "true") closeMenu();
        else openMenu();
      });

      options.forEach((option, index) => {
        option.addEventListener("click", () => {
          nativeSelect.value = option.dataset.value;
          currentLabel.textContent = option.textContent.trim();
          options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
          nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
          closeMenu(true);
        });
        option.addEventListener("keydown", (event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            options[(index + direction + options.length) % options.length].focus();
          } else if (event.key === "Home") {
            event.preventDefault();
            options[0].focus();
          } else if (event.key === "End") {
            event.preventDefault();
            options[options.length - 1].focus();
          } else if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
          }
        });
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMenu();
        }
      });

      document.addEventListener("pointerdown", (event) => {
        if (!picker.contains(event.target)) closeMenu();
      });
    });
  }

  function initializeDisclosureAnimations() {
    document.querySelectorAll("details").forEach((details) => {
      const summary = details.querySelector(":scope > summary");
      if (!summary) return;
      let activeAnimation = null;
      let desiredOpen = details.open;

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        desiredOpen = !desiredOpen;
        if (activeAnimation) activeAnimation.cancel();

        const startHeight = details.getBoundingClientRect().height;
        if (desiredOpen) details.open = true;
        details.style.height = startHeight + "px";
        details.style.overflow = "hidden";
        void details.offsetHeight;

        const endHeight = desiredOpen ? details.scrollHeight : summary.offsetHeight;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          details.open = desiredOpen;
          details.style.removeProperty("height");
          details.style.removeProperty("overflow");
          return;
        }

        activeAnimation = details.animate(
          [{ height: startHeight + "px" }, { height: endHeight + "px" }],
          { duration: 250, easing: "cubic-bezier(.2,.75,.25,1)" }
        );
        activeAnimation.onfinish = () => {
          details.open = desiredOpen;
          details.style.removeProperty("height");
          details.style.removeProperty("overflow");
          activeAnimation = null;
        };
      });
    });
  }

  initializePickers();
  initializeDisclosureAnimations();
  function updateSubtractionMethodVisibility() {
    subtractionMethodControl.hidden = categorySelect.value !== "subtraction";
    logicOperationControl.hidden = categorySelect.value !== "logic";
  }
  categorySelect.addEventListener("change", updateSubtractionMethodVisibility);
  updateSubtractionMethodVisibility();

  function renderExercise() {
    currentExercise = makeExercise();
    exerciseNumber += 1;
    exerciseType.textContent = currentExercise.type;
    exerciseCounter.textContent = "RETO " + exerciseNumber;
    exerciseTitle.textContent = currentExercise.title;
    problemBox.textContent = currentExercise.problem;
    renderBitPositionPanel(currentExercise.bitPanel);
    renderExerciseCheat(currentExercise);
    exerciseTip.textContent = currentExercise.tip;
    feedback.textContent = "";
    feedback.className = "feedback";
    solution.hidden = true;
    solution.textContent = "";
    answerInput.value = "";
    answerInput.inputMode = currentExercise.mode === "text" ? "text" : "decimal";
    answerInput.disabled = false;
    checkButton.disabled = false;
    answerInput.focus();
  }

  function isCorrect(rawAnswer) {
    if (!rawAnswer) return false;
    if (currentExercise.mode === "decimal") {
      const submitted = Number(cleanInput(rawAnswer));
      const expected = Number(currentExercise.answer);
      return Number.isFinite(submitted) &&
        Math.abs(submitted - expected) <= (currentExercise.tolerance || 0.000001);
    }
    if (currentExercise.mode === "text") {
      const normalize = (value) => value.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalize(rawAnswer) === normalize(currentExercise.answer);
    }
    return cleanBinary(rawAnswer).toLowerCase() === cleanBinary(currentExercise.answer).toLowerCase();
  }

  function solutionExplanation(exercise) {
    if (exercise.cheatType === "conversion") {
      if (exercise.type.includes("BINARIO A DECIMAL")) {
        return "Lee los pesos de derecha a izquierda: 1, 2, 4, 8… Multiplica cada bit por su peso y suma solo los valores de las posiciones que tienen un 1. " + exercise.explanation;
      }
      return "Divide el número entre 2 varias veces. Apunta el resto de cada división y léelos desde el último hasta el primero: así se forma el binario. " + exercise.explanation;
    }
    if (exercise.cheatType === "fraction") {
      if (exercise.type.includes("BINARIO A DECIMAL")) {
        return "A la izquierda de la coma se usan 1, 2, 4…; a la derecha, 0,5, 0,25, 0,125… Multiplica cada bit por su peso y suma los resultados. " + exercise.explanation;
      }
      return "Convierte la parte entera dividiendo entre 2. Para la parte decimal, multiplica por 2 y escribe cada parte entera que aparezca, de arriba abajo. " + exercise.explanation;
    }
    if (exercise.cheatType === "addition") {
      return "Empieza por la derecha y suma una columna cada vez. Cuando la suma sea 2 (1 + 1), escribe 0 y lleva 1 a la siguiente columna. " + exercise.explanation;
    }
    if (exercise.cheatType === "subtraction") {
      return "Empieza por la derecha. Si tienes que hacer 0 − 1, pide 1 prestado: esa columna pasa a valer 10₂ y 10₂ − 1₂ = 1₂. " + exercise.explanation;
    }
    if (exercise.cheatType === "C1") {
      return "Invierte cada bit del número que restas, súmalo al primero y, si sobra un acarreo por la izquierda, añádelo al resultado por la derecha. " + exercise.explanation;
    }
    if (exercise.cheatType === "C2") {
      return "Invierte cada bit del número que restas, suma 1 y después súmalo al primer número. Si queda un acarreo a la izquierda, se descarta. " + exercise.explanation;
    }
    if (exercise.cheatType === "parity") {
      return exercise.parityTask === "check"
        ? "Cuenta cuántos bits 1 hay en toda la secuencia. Un total divisible entre 2 es par; si sobra 1, es impar. " + exercise.explanation
        : "Cuenta los unos que ya aparecen. Añade 0 si el total ya cumple la paridad pedida o 1 si necesitas cambiarlo. " + exercise.explanation;
    }
    return "Aplica la regla de " + exercise.logicOperation + " a cada pareja de bits, columna por columna. " + exercise.explanation;
  }

  function solutionAdvice(exercise) {
    if (exercise.cheatType === "conversion" && exercise.type.includes("BINARIO A DECIMAL")) {
      return "Alinea cada bit con su potencia. Un bit 0 no aporta nada; suma únicamente los pesos que están debajo de un 1.";
    }
    if (exercise.cheatType === "conversion") {
      return "Los restos se leen en orden inverso: el último resto que obtienes es el primer bit del resultado.";
    }
    if (exercise.cheatType === "fraction" && exercise.type.includes("BINARIO A DECIMAL")) {
      return "Después de la coma, empieza con medio y divide ese peso entre 2 en cada posición.";
    }
    if (exercise.cheatType === "fraction") {
      return "Al multiplicar la parte decimal por 2, guarda el 0 o el 1 de cada paso en el mismo orden.";
    }
    if (exercise.cheatType === "addition") {
      return "Escribe cada acarreo encima de la columna siguiente para no perderlo.";
    }
    if (exercise.cheatType === "subtraction") {
      return "Si no puedes pedir prestado de la columna inmediata, busca el primer 1 a la izquierda; los ceros intermedios pasan a valer 1.";
    }
    if (exercise.cheatType === "C1") {
      return "No olvides el acarreo recurrente: en complemento a 1 vuelve al bit de la derecha.";
    }
    if (exercise.cheatType === "C2") {
      return "En complemento a 2 el acarreo final se descarta; no lo sumes otra vez.";
    }
    if (exercise.cheatType === "parity") {
      return "La paridad depende solo de si hay una cantidad par o impar de unos; los ceros no cambian el conteo.";
    }
    if (exercise.logicOperation === "AND") return "AND solo da 1 cuando los dos bits de esa columna son 1.";
    if (exercise.logicOperation === "OR") return "OR da 1 si al menos uno de los dos bits de esa columna es 1.";
    if (exercise.logicOperation === "NAND") return "NAND es AND y luego se invierte el resultado.";
    if (exercise.logicOperation === "NOR") return "NOR es OR y luego se invierte el resultado.";
    if (exercise.logicOperation === "XOR") return "XOR da 1 cuando los dos bits de esa columna son diferentes.";
    return "NOT trabaja con un solo número: cambia cada 0 por 1 y cada 1 por 0.";
  }

  function renderSolution() {
    solution.replaceChildren();

    const header = document.createElement("div");
    header.className = "solution-header";
    const mark = document.createElement("span");
    mark.className = "solution-mark";
    mark.textContent = "✓";
    const heading = document.createElement("div");
    const headingTitle = document.createElement("strong");
    headingTitle.textContent = "Solución del ejercicio";
    const headingSubtitle = document.createElement("span");
    headingSubtitle.textContent = "Mira el resultado y sigue el razonamiento";
    heading.append(headingTitle, headingSubtitle);
    header.append(mark, heading);

    const result = document.createElement("div");
    result.className = "solution-result";
    const resultLabel = document.createElement("span");
    resultLabel.textContent = "RESULTADO";
    const resultValue = document.createElement("strong");
    resultValue.textContent = currentExercise.answer + (currentExercise.mode === "decimal" ? "₁₀" : currentExercise.mode === "text" ? "" : "₂");
    result.append(resultLabel, resultValue);

    const explanation = document.createElement("div");
    explanation.className = "solution-explanation";
    const explanationLabel = document.createElement("strong");
    explanationLabel.textContent = "Cómo resolverlo";
    const explanationText = document.createElement("p");
    explanationText.textContent = solutionExplanation(currentExercise);
    explanation.append(explanationLabel, explanationText);

    const advice = document.createElement("div");
    advice.className = "solution-advice";
    const adviceLabel = document.createElement("strong");
    adviceLabel.textContent = "Consejo";
    const adviceText = document.createElement("p");
    adviceText.textContent = solutionAdvice(currentExercise);
    advice.append(adviceLabel, adviceText);

    solution.append(header, result, explanation, advice);
    solution.hidden = false;
  }
  function checkAnswer() {
    if (!currentExercise) return;
    const answer = answerInput.value.trim();
    if (!answer) {
      feedback.textContent = "Escribe una respuesta antes de comprobarla.";
      feedback.className = "feedback bad";
      answerInput.focus();
      return;
    }
    if (isCorrect(answer)) {
      feedback.textContent = "¡Correcto! Has resuelto el reto.";
      feedback.className = "feedback good";
    } else {
      feedback.textContent = "Aún no. Revisa las posiciones y vuelve a intentarlo.";
      feedback.className = "feedback bad";
    }
    renderSolution();
  }


  const themeToggle = $("#themeToggle");
  const savedTheme = localStorage.getItem("binario-lab-theme");
  const preferredDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", dark ? "Activar modo claro" : "Activar modo oscuro");
    themeToggle.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent = dark ? "Modo claro" : "Modo oscuro";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#111827" : "#101a2d";
  }

  applyTheme(savedTheme || (preferredDark ? "dark" : "light"));
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("binario-lab-theme", nextTheme);
    applyTheme(nextTheme);
  });
  generateButton.addEventListener("click", renderExercise);
  checkButton.addEventListener("click", checkAnswer);
  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") checkAnswer();
  });
})();
























