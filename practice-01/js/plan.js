"use strict";

const totalTasks = 5;
const completedTasks = 2;
const dailyLimit = 1001;

function isValidCount(value) {
  return typeof value === "number" && Number.isInteger(value);
}

if (!isValidCount(totalTasks) || !isValidCount(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом.");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: превышена допустимая граница количества задач.");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: некорректное число выполненных задач.");
} else if (!isValidCount(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) {
  console.log("Ошибка: дневная норма должна быть целым числом от 1 до 1000.");
} else {
  let remaining = totalTasks - completedTasks;

  console.log(`Осталось задач: ${remaining}`);

  if (remaining === 0) {
    console.log("Все задачи уже выполнены.");
    console.log("Потребуется дней: 0");
  } else {
    let day = 0;

    while (remaining > 0) {
      day += 1;
      const doneToday = Math.min(dailyLimit, remaining);
      remaining -= doneToday;
      console.log(`День ${day}: выполнено ${doneToday}, осталось ${remaining}`);
    }

    console.log(`Потребуется дней: ${day}`);
  }
}