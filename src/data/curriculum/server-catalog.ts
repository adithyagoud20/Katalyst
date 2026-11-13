import {
  validateLearningCatalog,
  type LearningCatalog,
  type LearningCourse,
  type LearningLesson,
  type LearningSubject,
} from "@/lib/learning-curriculum";

import { cProgrammingSubject, cProgrammingPath } from "./c-foundations";
import { pythonProgrammingSubject, pythonProgrammingPath } from "./python-foundations";
import { javascriptProgrammingSubject, javascriptProgrammingPath } from "./javascript-algorithms";
import { digitalCircuitsSubject, digitalCircuitsPath } from "./digital-circuits";
import { sqlDatabasesSubject, sqlDatabasesPath } from "./sql-databases";
import { htmlCssWebSubject, htmlCssWebPath } from "./html-css-web";
import { dsaMasterySubject, dsaMasteryPath } from "./dsa-mastery";
import { promptEngineeringSubject, promptEngineeringPath } from "./prompt-engineering";
import { photoEditingMediaSubject, photoEditingMediaPath } from "./photo-editing-media";

export {
  cProgrammingSubject,
  cProgrammingPath,
  pythonProgrammingSubject,
  pythonProgrammingPath,
  javascriptProgrammingSubject,
  javascriptProgrammingPath,
  digitalCircuitsSubject,
  digitalCircuitsPath,
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
};

export const serverSubjects: LearningSubject[] = [
  cProgrammingSubject,
  pythonProgrammingSubject,
  javascriptProgrammingSubject,
  digitalCircuitsSubject,
  sqlDatabasesSubject,
  htmlCssWebSubject,
  dsaMasterySubject,
  promptEngineeringSubject,
  photoEditingMediaSubject,
];

export const serverCourses: LearningCourse[] = [
  cProgrammingPath,
  pythonProgrammingPath,
  javascriptProgrammingPath,
  digitalCircuitsPath,
  sqlDatabasesPath,
  htmlCssWebPath,
  dsaMasteryPath,
  promptEngineeringPath,
  photoEditingMediaPath,
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

export function getServerLesson(courseId: string, lessonId: string): LearningLesson | undefined {
  const course = getServerCourse(courseId);
  if (!course) return undefined;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      if (lesson.id === lessonId) return lesson;
    }
  }
  return undefined;
}
