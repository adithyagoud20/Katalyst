import {
  validateLearningCatalog,
  type LearningCatalog,
  type LearningCourse,
  type LearningLesson,
  type LearningSubject,
} from "@/lib/learning-curriculum";

import { cProgrammingSubject, cProgrammingPath } from "./c-foundations";
import { cppProgrammingSubject, cppProgrammingCourse } from "./cpp-programming";
import { pythonProgrammingSubject, pythonProgrammingPath } from "./python-foundations";
import { aiAppWebDevSubject, aiAppWebDevCourse } from "./ai-app-web-dev";
import { arduinoEmbeddedSubject, arduinoEmbeddedCourse } from "./arduino-embedded";
import { esp32IotSubject, esp32IotCourse } from "./esp32-iot-systems";
import { breadboardElectronicsSubject, breadboardElectronicsCourse } from "./breadboard-electronics";
import { javascriptProgrammingSubject, javascriptProgrammingPath } from "./javascript-algorithms";
import { sqlDatabasesSubject, sqlDatabasesPath } from "./sql-databases";
import { htmlCssWebSubject, htmlCssWebPath } from "./html-css-web";
import { dsaMasterySubject, dsaMasteryPath } from "./dsa-mastery";
import { promptEngineeringSubject, promptEngineeringPath } from "./prompt-engineering";
import { photoEditingMediaSubject, photoEditingMediaPath } from "./photo-editing-media";
import { digitalCircuitsSubject, digitalCircuitsPath } from "./digital-circuits";
import { circuitsEeeCoreSubject, circuitsEeeCorePath } from "./circuits-eee-core";
import { controlAndSignalsSubject, controlAndSignalsPath } from "./control-and-signals";
import { embeddedCapstonesSubject, embeddedCapstonesPath } from "./embedded-capstones";
import { creativeEngineeringSubject, creativeEngineeringPath } from "./creative-engineering";

export {
  cProgrammingSubject,
  cProgrammingPath,
  cppProgrammingSubject,
  cppProgrammingCourse,
  pythonProgrammingSubject,
  pythonProgrammingPath,
  aiAppWebDevSubject,
  aiAppWebDevCourse,
  arduinoEmbeddedSubject,
  arduinoEmbeddedCourse,
  esp32IotSubject,
  esp32IotCourse,
  breadboardElectronicsSubject,
  breadboardElectronicsCourse,
  javascriptProgrammingSubject,
  javascriptProgrammingPath,
  sqlDatabasesSubject,
  sqlDatabasesPath,
  htmlCssWebSubject,
  htmlCssWebPath,
  dsaMasterySubject,
  dsaMasteryPath,
  promptEngineeringSubject,
  promptEngineeringPath,
  photoEditingMediaSubject,
  photoEditingMediaPath,
  digitalCircuitsSubject,
  digitalCircuitsPath,
  circuitsEeeCoreSubject,
  circuitsEeeCorePath,
  controlAndSignalsSubject,
  controlAndSignalsPath,
  embeddedCapstonesSubject,
  embeddedCapstonesPath,
  creativeEngineeringSubject,
  creativeEngineeringPath,
};

export const serverSubjects: LearningSubject[] = [
  cProgrammingSubject,
  cppProgrammingSubject,
  pythonProgrammingSubject,
  aiAppWebDevSubject,
  arduinoEmbeddedSubject,
  esp32IotSubject,
  breadboardElectronicsSubject,
  javascriptProgrammingSubject,
  sqlDatabasesSubject,
  htmlCssWebSubject,
  dsaMasterySubject,
  promptEngineeringSubject,
  photoEditingMediaSubject,
  digitalCircuitsSubject,
  circuitsEeeCoreSubject,
  controlAndSignalsSubject,
  embeddedCapstonesSubject,
  creativeEngineeringSubject,
];

export const serverCourses: LearningCourse[] = [
  cProgrammingPath,
  cppProgrammingCourse,
  pythonProgrammingPath,
  aiAppWebDevCourse,
  arduinoEmbeddedCourse,
  esp32IotCourse,
  breadboardElectronicsCourse,
  javascriptProgrammingPath,
  sqlDatabasesPath,
  htmlCssWebPath,
  dsaMasteryPath,
  promptEngineeringPath,
  photoEditingMediaPath,
  digitalCircuitsPath,
  circuitsEeeCorePath,
  controlAndSignalsPath,
  embeddedCapstonesPath,
  creativeEngineeringPath,
];

let _validatedCatalog: LearningCatalog | null = null;

export function getServerCatalog(): LearningCatalog {
  if (!_validatedCatalog) {
    const catalogValidation = validateLearningCatalog({
      subjects: serverSubjects,
      courses: serverCourses,
    });

    if (!catalogValidation.success) {
      throw new Error(
        `The server learning catalog failed validation: ${catalogValidation.error.issues
          .map((issue) => issue.message)
          .join("; ")}`
      );
    }
    _validatedCatalog = catalogValidation.data;
  }
  return _validatedCatalog;
}

export const serverCatalog: LearningCatalog = {
  get subjects() {
    return getServerCatalog().subjects;
  },
  get courses() {
    return getServerCatalog().courses;
  },
};

export function getServerCourses(): LearningCourse[] {
  return getServerCatalog().courses;
}

export function getServerCourse(courseId: string): LearningCourse | undefined {
  return getServerCatalog().courses.find((course) => course.id === courseId);
}

export function getServerLesson(courseIdOrLessonId: string, maybeLessonId?: string): LearningLesson | undefined {
  const catalog = getServerCatalog();
  if (maybeLessonId) {
    const course = catalog.courses.find((c) => c.id === courseIdOrLessonId);
    if (!course) return undefined;
    for (const mod of course.modules) {
      const match = mod.lessons.find((l) => l.id === maybeLessonId);
      if (match) return match;
    }
    return undefined;
  }
  for (const course of catalog.courses) {
    for (const mod of course.modules) {
      const match = mod.lessons.find((l) => l.id === courseIdOrLessonId);
      if (match) {
        return match;
      }
    }
  }
  return undefined;
}
