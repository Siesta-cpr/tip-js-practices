"use strict";

const totalTasks = 12;
const completedTasks = 5;

function isValidCount(value) {
  return typeof value === "number" && Number.isInteger(value);
}

if (!isValidCount(totalTasks) || !isValidCount(completedTasks)) {
  console.log("Ошибка: вместо числа передано недопустимое значение.");
} else if (totalTasks < 0 || totalTasks > 1000) {
  console.log("Ошибка: превышена допустимая граница количества задач.");
} else if (completedTasks < 0 || completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше, чем существует, либо отрицательное количество.");
} else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remaining = totalTasks - completedTasks;
  const percent = (completedTasks / totalTasks) * 100;

  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  } else {
    status = "В работе";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remaining}`);
  console.log(`Прогресс: ${percent.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}