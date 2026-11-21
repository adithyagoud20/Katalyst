export const defaultCppProgram = `// C++17 browser workbench: templates
#include <stdio.h>

template <typename T>
T doubleValue(T value) {
  return value + value;
}

int main() {
  const int value = 21;
  printf("Twice: %d\\n", doubleValue(value));
  return 0;
}
`;
