let quizElements = [];
let quizType = "symbole";

let notifier = new AWN({
  icons: { enabled: false },
  durations: {
    success: 1000,
    alert: 5000,
  },
  labels: {
    success: "Dobrze!",
    alert: "Źle!",
  },
});


const stats = {
  correct: document.querySelector("#correct > span"),
  incorrect: document.querySelector("#incorrect > span"),
  total: document.querySelector("#sum > span"),
};

function getLowestAsked() {
  let lowest = Infinity;
  let lowestElements = [];

  for (const element of quizElements) {
    const elementCell = document.querySelector(`#periodic-table > tbody > tr > td.element:not(.empty)[data-symbol="${element}"]`);
    const timesAsked = elementCell.dataset.timesAsked;
    if (timesAsked < lowest) {
      lowest = timesAsked;
      lowestElements = [element];
    }
    else if (timesAsked === lowest) {
      lowestElements.push(element);
    }
  }

  let lowestCorrectPercentage = 1.0;
  let lowestCorrectPercentageElement = null;
  for (const element of lowestElements) {
    const elementCell = document.querySelector(`#periodic-table > tbody > tr > td.element:not(.empty)[data-symbol="${element}"]`);
    const correctPercentage = Number.parseInt(elementCell.dataset.correct) / (Number.parseInt(elementCell.dataset.correct) + Number.parseInt(elementCell.dataset.incorrect));
    if (correctPercentage < lowestCorrectPercentage) {
      lowestCorrectPercentage = correctPercentage;
      lowestCorrectPercentageElement = element;
    }
  }

  return lowestCorrectPercentageElement || lowestElements[Math.floor(Math.random() * lowestElements.length)];
}

function nextQuestion() {
  const element = getLowestAsked();
  const elementCell = document.querySelector(`#periodic-table > tbody > tr > td.element:not(.empty)[data-symbol="${element}"]`);
  elementCell.classList.add("question");
  const question = document.querySelector("#question");
  question.textContent = quizType === "symbole" ? elementCell.dataset.name : elementCell.dataset.symbol;
  question.dataset.answer = quizType === "symbole" ? elementCell.dataset.symbol : elementCell.dataset.name;
  question.dataset.symbol = element;
  document.querySelector("#answer").value = "";

  elementCell.dataset.timesAsked++;
}

function checkAnswer() {
  const correct = document.querySelector("#question").dataset.answer;
  const user = document.querySelector("#answer").value;

  const symbol = document.querySelector("#question").dataset.symbol;
  const element = document.querySelector(`#periodic-table > tbody > tr > td.element:not(.empty)[data-symbol="${symbol}"]`);
  const elementName = quizType === "symbole" ? element.dataset.name : element.dataset.symbol;
  if (correct.toLowerCase() === user.toLowerCase()) {
    element.dataset.correct++;
    stats.correct.textContent = Number.parseInt(stats.correct.textContent) + 1;
    notifier.success(`${elementName}: ${user}`);
  }
  else {
    element.dataset.incorrect++;
    stats.incorrect.textContent = Number(stats.incorrect.textContent) + 1;
    notifier.alert(`${elementName}: Poprawna odpowiedź: ${correct}, Twoja odpowiedź: ${user}`)
  }
  stats.total.textContent = Number(stats.total.textContent) + 1;


  const correctPercentage = Number.parseInt(element.dataset.correct) / (Number.parseInt(element.dataset.correct) + Number.parseInt(element.dataset.incorrect));
  if (correctPercentage > 0.5) {
    element.classList.add("correct");
    element.classList.remove("incorrect");
    element.classList.remove("half-correct");
  }
  else if (correctPercentage >= 0.1) {
    element.classList.add("half-correct");
    element.classList.remove("correct");
    element.classList.remove("incorrect");
  }
  else {
    element.classList.add("incorrect");
    element.classList.remove("correct");
    element.classList.remove("half-correct");
  }

  nextQuestion();
}

function startQuiz() {
  const elements = document.querySelectorAll("#periodic-table > tbody > tr > td.element");
  quizElements = [];
  for (const element of elements) {
    element.textContent = "  ";
    if (element.classList.contains("selected")) {
      quizElements.push(element.dataset.symbol);
    }
  }

  document.querySelector("#start-quiz").disabled = true;

  const answer = document.querySelector("#answer");
  answer.disabled = false;
  answer.focus();
  document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    checkAnswer();
  });

  quizType = document.querySelector("#quiz-symbole").checked ? "symbole" : "nazwy";

  nextQuestion();
}

async function setElements() {
  const response = await fetch("elements.json");
  const elements = await response.json();
  for (const element of elements) {
    const [symbol, name, [x, y]] = element;
    if (typeof x !== "number" || typeof y !== "number") {
      console.log("todo");
      continue;
    }

    const elementCell = document.querySelector(`#periodic-table > tbody > tr:nth-child(${y + 1}) > td.element:nth-child(${x + 1})`);
    elementCell.classList.remove("empty");
    elementCell.textContent = symbol;
    elementCell.dataset.name = name;
    elementCell.dataset.symbol = symbol;

    elementCell.dataset.correct = 0;
    elementCell.dataset.incorrect = 0;

    elementCell.dataset.timesAsked = 0;

    elementCell.addEventListener("click", () => {
      elementCell.classList.toggle("selected");
    });
  }

  const rowButtons = document.querySelectorAll("#periodic-table > tbody > tr > th.row-button");
  for (const rowButton of rowButtons) {
    rowButton.addEventListener("click", () => {
      const row = rowButton.parentElement;
      const elements = row.querySelectorAll("td.element:not(.empty)");
      for (const element of elements) {
        element.classList.toggle("selected");
      }
    });
  }

  const columnButtons = document.querySelectorAll("#periodic-table > tbody > tr:nth-child(1) > th.column-button");
  for (const columnButton of columnButtons) {
    columnButton.addEventListener("click", () => {
      const column = columnButton.cellIndex;
      const elements = document.querySelectorAll(`#periodic-table > tbody > tr > td.element:nth-child(${column + 1}):not(.empty)`);
      for (const element of elements) {
        element.classList.toggle("selected");
      }
    });
  }

  const startButton = document.querySelector("#start-quiz");
  startButton.addEventListener("click", startQuiz);
}

setElements();
