import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
 
console.log("ПР2. Заготовка демонстрационного сценария");
console.log("Количество задач в общем наборе:", demoTasks.length);
console.log("Номер варианта:", variantNumber);
console.log("Количество задач в индивидуальном наборе:", variantTasks.length);
 
function printStats(tasks, label) {
  const { total, completed, pending, progress } = getTaskStats(tasks);
  console.log(`\n${label}`);
  console.log(`Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}
 
function runScenario(initialTasks, options) {
  let currentTasks = initialTasks;
 
  console.log("\n=== Исходные данные ===");
  console.table(currentTasks);
  console.log("Названия:", getTaskTitles(currentTasks));
  console.log("Невыполненные:", getPendingTasks(currentTasks).map((t) => t.id));
  printStats(currentTasks, "Сводка по исходному набору");
 
  const addResult = addTask(
    currentTasks,
    options.newTask.id,
    options.newTask.title,
    options.newTask.priority
  );
  if (addResult.ok) {
    currentTasks = addResult.tasks;
    printStats(currentTasks, `После добавления id = ${options.newTask.id}`);
  } else {
    console.error(`Ошибка добавления: ${addResult.error}`);
  }
 
  const completeResult = setTaskCompleted(currentTasks, options.completeId, true);
  if (completeResult.ok) {
    currentTasks = completeResult.tasks;
    printStats(currentTasks, `После выполнения id = ${options.completeId}`);
  } else {
    console.error(`Ошибка изменения статуса: ${completeResult.error}`);
  }
 
  const renameResult = renameTask(currentTasks, options.renameId, options.renameTitle);
  if (renameResult.ok) {
    currentTasks = renameResult.tasks;
    printStats(currentTasks, `После переименования id = ${options.renameId}`);
  } else {
    console.error(`Ошибка переименования: ${renameResult.error}`);
  }
 
  const removeResult = removeTask(currentTasks, options.removeId);
  if (removeResult.ok) {
    currentTasks = removeResult.tasks;
    printStats(currentTasks, `После удаления id = ${options.removeId}`);
  } else {
    console.error(`Ошибка удаления: ${removeResult.error}`);
  }
 
  // Показ обработанного отказа: повторное добавление уже существующего id.
  const duplicateResult = addTask(
    currentTasks,
    options.newTask.id,
    "Повторная задача",
    "low"
  );
  if (!duplicateResult.ok) {
    console.log(`\nОжидаемый отказ при повторном добавлении: ${duplicateResult.error}`);
  } else {
    currentTasks = duplicateResult.tasks;
    console.log("Неожиданно: повторное добавление прошло успешно");
  }
 
  console.log("\nИтоговые задачи:");
  console.table(currentTasks);
  console.log("Идентификаторы:", currentTasks.map((task) => task.id));
 
  return currentTasks;
}
 
console.log("\n########## Общий сценарий (demoTasks) ##########");
runScenario(demoTasks, {
  newTask: { id: 20, title: "Добавить проверку", priority: "high" },
  completeId: 4,
  renameId: 10,
  renameTitle: "Подготовить инструкцию запуска",
  removeId: 7,
});
 
console.log("\nИсходный demoTasks не изменился:");
console.table(demoTasks);
 
console.log("\n\n########## Индивидуальный вариант (№", variantNumber, ") ##########");
runScenario(variantTasks, {
  newTask: { id: 80, title: "Подготовить итоговую демонстрацию", priority: "high" },
  completeId: 11,
  renameId: 23,
  renameTitle: "Обновлённое название задачи 23",
  removeId: 37,
});
 
console.log("\nИсходный variantTasks не изменился:");
console.table(variantTasks);
 