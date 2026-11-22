import "server-only";
import type { LearningCourseDetail } from "@/lib/learning-curriculum";

type CourseLoader = () => Promise<LearningCourseDetail>;

const courseLoaders: Record<string, CourseLoader> = {
  "c-programming-foundations": async () => (await import("./c-foundations")).cProgrammingPath,
  "cpp-programming": async () => (await import("./cpp-programming")).cppProgrammingCourse,
  "python-programming-foundations": async () => (await import("./python-foundations")).pythonProgrammingPath,
  "ai-app-web-dev": async () => (await import("./ai-app-web-dev")).aiAppWebDevCourse,
  "arduino-embedded": async () => (await import("./arduino-embedded")).arduinoEmbeddedCourse,
  "esp32-iot-systems": async () => (await import("./esp32-iot-systems")).esp32IotCourse,
  "breadboard-electronics": async () => (await import("./breadboard-electronics")).breadboardElectronicsCourse,
  "js-systems-algorithms": async () => (await import("./javascript-algorithms")).javascriptProgrammingPath,
  "sql-databases": async () => (await import("./sql-databases")).sqlDatabasesPath,
  "html-css-web": async () => (await import("./html-css-web")).htmlCssWebPath,
  "dsa-mastery": async () => (await import("./dsa-mastery")).dsaMasteryPath,
  "prompt-engineering": async () => (await import("./prompt-engineering")).promptEngineeringPath,
  "photo-editing-media": async () => (await import("./photo-editing-media")).photoEditingMediaPath,
  "digital-logic-circuits": async () => (await import("./digital-circuits")).digitalCircuitsPath,
  "circuits-eee-core": async () => (await import("./circuits-eee-core")).circuitsEeeCorePath,
  "control-and-signals": async () => (await import("./control-and-signals")).controlAndSignalsPath,
  "embedded-capstone-projects": async () => (await import("./embedded-capstones")).embeddedCapstonesPath,
  "creative-engineering-lab": async () => (await import("./creative-engineering")).creativeEngineeringPath,
  "engineering-career-prep": async () => (await import("./engineering-career-prep")).engineeringCareerPrepPath,
};

export async function loadCourseDetail(courseId: string): Promise<LearningCourseDetail | undefined> {
  const load = courseLoaders[courseId];
  return load ? load() : undefined;
}
