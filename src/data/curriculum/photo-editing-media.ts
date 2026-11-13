import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExampleRun,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const photoEditingMediaSubject: LearningSubject = {
  id: "media-dsp",
  title: "Computational Photography & Digital Media",
  description: "Pixel buffers, RGBA color models, HSL conversions, histogram tone mapping, spatial 2D convolutions, and Porter-Duff compositing.",
};

export const photoEditingMediaObjectives: LearningObjective[] = [
  { id: "media-pixel-buffers", title: "Manipulate contiguous 1D RGBA pixel buffers, stride calculation, and byte arrays." },
  { id: "media-color-spaces", title: "Convert colors between RGB, HSL, and calculate perceptual photometric luminance." },
  { id: "media-histograms", title: "Analyze luminance histograms, tonal distribution, and identify shadow/highlight clipping." },
  { id: "media-tone-curves", title: "Apply non-linear contrast curves, exposure offsets, and white balance color channel gains." },
  { id: "media-convolutions", title: "Apply 3x3 spatial convolution kernels for Gaussian blur, sharpening, and edge detection." },
  { id: "media-blend-modes", title: "Implement Porter-Duff alpha compositing and photometric blend modes (Multiply, Screen, Overlay)." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Beginner",
  starterCode?: string,
  testCases?: ExerciseTestCase[],
): LearningExercise {
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    hints,
    hint: hints[0],
    difficulty,
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
}

function exampleRun(expectedOutput: string, sampleInput?: string): LearningExampleRun {
  return { expectedOutput, ...(sampleInput !== undefined ? { sampleInput } : {}) };
}

function moduleData(
  id: string,
  order: number,
  title: string,
  summary: string,
  lessons: LearningLesson[],
): LearningModule {
  return { id, order, title, summary, lessons };
}

export const photoEditingMediaLessons: LearningLesson[] = [
  // Module 1: Pixels & Color Representations
  {
    id: "media-pixels-rgba-buffers",
    order: 1,
    title: "Pixel Buffers, Stride, and 1D Memory Layouts",
    summary: "Master core concepts and hands-on engineering techniques for pixel buffers, stride, and 1d memory layouts.",
    type: "guided-coding",
    objectiveIds: ["media-pixel-buffers"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Inspect individual pixel coordinates and color channels across the procedural test card.",
    },
    content: `A digital bitmap image is a 2-dimensional grid of picture elements (**pixels**) of dimensions $W \\times H$. However, physical computer memory is a flat, contiguous 1-dimensional array of bytes.

### The 1D RGBA Layout
Each pixel occupies 4 consecutive 8-bit bytes (0 to 255):
\`[Red, Green, Blue, Alpha]\`
For an image with width $W$ and height $H$, the total byte length is:
\`Total Bytes = Width * Height * 4\`

### Computing 1D Offset from 2D Coordinates (x, y)
To read or write the pixel at coordinate $(x, y)$:
\`\`\`javascript
const index = (y * width + x) * 4;
const r = buffer[index];
const g = buffer[index + 1];
const b = buffer[index + 2];
const a = buffer[index + 3];
\`\`\`
- \`y * width\` skips all preceding rows.
- \`+ x\` skips preceding pixels in the current row.
- \`* 4\` accounts for the 4 bytes per pixel.`,
    theorySections: [
      {
        title: "Row Stride and Memory Alignment",
        id: "photo-editing-media-sec-1",
        content: `In graphics hardware and GPU buffers, row stride (pitch) may exceed width * 4 to align rows on 16-byte, 32-byte, or 64-byte boundaries. Alignment enables SIMD (Single Instruction Multiple Data) vector instructions (AVX2, NEON) to process 4 or 8 pixels in a single CPU cycle.`,
      },
      {
        title: "Uint8ClampedArray in JavaScript",
        id: "photo-editing-media-sec-2",
        content: `Standard Uint8Array wraps out-of-bounds math (250 + 10 = 4). HTML Canvas ImageData utilizes Uint8ClampedArray, which automatically clamps calculations to [0, 255] (250 + 10 = 255; -5 = 0), preventing visual color inversion artifacts.`,
      },
    ],
    codeExamples: [
      {
        title: "Inverting a Pixel Buffer in JavaScript",
        description: "Loops over 1D byte buffer and inverts color channels.",
        code: `function invertImage(buffer) {
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i]     = 255 - buffer[i];     // Red
    buffer[i + 1] = 255 - buffer[i + 1]; // Green
    buffer[i + 2] = 255 - buffer[i + 2]; // Blue
    // Alpha channel (i + 3) remains untouched
  }
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-pixels-rgba-buffers",
      "Calculate 1D Buffer Index",
      "Write a function `getPixelIndex(x, y, width)` that returns the starting 1D byte index for pixel `(x, y)` in a 4-channel RGBA image. Test with (10, 5, 100) and (0, 0, 800).",
      `function getPixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

console.log(getPixelIndex(10, 5, 100));
console.log(getPixelIndex(0, 0, 800));`,
      "media-pixel-buffers",
      "1D pixel buffer index calculated from coordinates.",
      [
        "Use formula: (y * width + x) * 4",
      ],
      "Beginner",
      `function getPixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

console.log(getPixelIndex(10, 5, 100));
console.log(getPixelIndex(0, 0, 800));`,
      [
        {
          id: "tc-media-idx-1",
          label: "Calculates correct buffer offsets",
          stdin: "",
          expectedStdout: "2040\n0",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does a 1920x1080 RGBA image require approximately 8.3 megabytes of uncompressed RAM?",
      "Because 1920 * 1080 * 4 bytes = 8,294,400 bytes (approx 7.9 MiB or 8.3 MB).",
    ),
    exampleRun: exampleRun("2040\n0"),
  },
  {
    id: "media-color-spaces-conversions",
    order: 2,
    title: "Color Spaces: RGB, HSL, and Photometric Luminance",
    summary: "Master core concepts and hands-on engineering techniques for color spaces: rgb, hsl, and photometric luminance.",
    type: "guided-coding",
    objectiveIds: ["media-color-spaces"],
    prerequisiteLessonIds: ["media-pixels-rgba-buffers"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Adjust Saturation and observe real-time perceptual grayscale conversion.",
    },
    content: `While RGB corresponds directly to computer display hardware (red, green, and blue subpixels), it is non-intuitive for human color editing.

### Human Perceptual Luminance
Human vision possesses vastly different sensitivities to different wavelengths. The human eye has far more green-sensitive cone cells than blue-sensitive cones.

A naive average \`(R + G + B) / 3\` produces unnatural grayscale images. The standard **ITU-R BT.601** formula computes true perceptual luminance ($Y$):
$$Y = 0.299 \\times R + 0.587 \\times G + 0.114 \\times B$$
Notice that Green accounts for nearly 59% of perceived brightness!

### HSL (Hue, Saturation, Lightness)
- **Hue ($H \\in [0, 360^\\circ]$)**: The base color tint on the color wheel (0° = Red, 120° = Green, 240° = Blue).
- **Saturation ($S \\in [0, 1]$)**: Purity/vibrancy of color (0 = neutral gray, 1 = vivid pure color).
- **Lightness ($L \\in [0, 1]$)**: Intensity from black (0) to white (1).`,
    theorySections: [
      {
        title: "Gamma Correction and Linear vs sRGB Color",
        id: "photo-editing-media-sec-3",
        content: `Standard sRGB displays apply a non-linear power curve (gamma approx 2.2) to match human eye sensitivity. For mathematically rigorous light physics and blurring, pixel values must be converted to linear light (un-gamma), calculated, and re-encoded to sRGB.`,
      },
      {
        title: "Color Saturation Scaling Formula",
        id: "photo-editing-media-sec-4",
        content: `To adjust saturation by factor S: compute luminance Y = 0.299R + 0.587G + 0.114B. Then interpolate: R' = Y + (R - Y) * S. When S = 0, the color collapses to grayscale; when S = 1, it remains unchanged; when S > 1, color vibrancy is amplified.`,
      },
    ],
    codeExamples: [
      {
        title: "Perceptual Grayscale Conversion",
        description: "Converts an RGB color into a perceptually accurate grayscale byte.",
        code: `function toGrayscale(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

console.log("Pure Green Luminance:", toGrayscale(0, 255, 0)); // 150
console.log("Pure Blue Luminance:", toGrayscale(0, 0, 255));  // 29`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-color-spaces-conversions",
      "Calculate Perceptual Luminance",
      "Write a function `calculateLuminance(r, g, b)` that returns the integer perceptual luminance using `Math.round(0.299 * r + 0.587 * g + 0.114 * b)`. Test with (255, 255, 255) and (0, 255, 0).",
      `function calculateLuminance(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

console.log(calculateLuminance(255, 255, 255));
console.log(calculateLuminance(0, 255, 0));`,
      "media-color-spaces",
      "Perceptual luminance computed using BT.601 weights.",
      [
        "Use formula: Math.round(0.299 * r + 0.587 * g + 0.114 * b)",
      ],
      "Beginner",
      `function calculateLuminance(r, g, b) {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
}

console.log(calculateLuminance(255, 255, 255));
console.log(calculateLuminance(0, 255, 0));`,
      [
        {
          id: "tc-media-lum-1",
          label: "Calculates correct perceptual luminance",
          stdin: "",
          expectedStdout: "255\n150",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does pure green appear far brighter to human eyes than pure blue at identical 255 intensity?",
      "Human retinas possess significantly more green-sensitive cones, weighting green at ~58.7% of perceived luminance versus blue at ~11.4%.",
    ),
    exampleRun: exampleRun("255\n150"),
  },

  // Module 2: Histograms & Tone Adjustments
  {
    id: "media-histograms-exposure",
    order: 3,
    title: "Luminance Histograms and Exposure Adjustments",
    summary: "Master core concepts and hands-on engineering techniques for luminance histograms and exposure adjustments.",
    type: "guided-coding",
    objectiveIds: ["media-histograms"],
    prerequisiteLessonIds: ["media-color-spaces-conversions"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Manipulate Exposure and observe how the real-time RGB histogram shifts left and right.",
    },
    content: `A **Histogram** is a graphical distribution of tonal values in an image. The horizontal axis represents brightness from 0 (pure black) to 255 (pure white), while the vertical axis indicates the number of pixels at each intensity level.

### Reading a Histogram
- **Underexposed**: High concentration of pixels bunched against the far left edge (shadow clipping / crushed blacks).
- **Overexposed**: High concentration of pixels bunched against the far right edge (blown highlights).
- **Balanced**: A bell-curve distribution across the midtones with smooth falloff toward extremes.

### Exposure Adjustment
Exposure shifts all tonal values linearly by a constant offset $\\Delta$:
\`\`\`javascript
function applyExposure(value, exposureOffset) {
  return Math.min(255, Math.max(0, value + exposureOffset));
}
\`\`\``,
    theorySections: [
      {
        title: "Dynamic Range and Bit Depth",
        id: "photo-editing-media-sec-5",
        content: `Standard 8-bit JPEG images store 256 discrete levels per channel. Once pixels are clipped to 255, information is permanently destroyed. 14-bit or 16-bit RAW sensor data captures 16,384 discrete levels, providing 'headroom' to recover clipped highlights without posterization.`,
      },
      {
        title: "Cumulative Distribution Function (CDF) and Equalization",
        id: "photo-editing-media-sec-6",
        content: `Histogram equalization computes the running cumulative sum of histogram bins and maps pixel values to evenly spread the CDF across the entire [0, 255] spectrum, maximizing global image contrast in medical and satellite imaging.`,
      },
    ],
    codeExamples: [
      {
        title: "Computing a 256-Bin Histogram in JavaScript",
        description: "Counts pixel frequency across 0-255 luminance bins.",
        code: `function computeHistogram(grayBuffer) {
  const bins = new Array(256).fill(0);
  for (let i = 0; i < grayBuffer.length; i++) {
    const val = grayBuffer[i];
    bins[val]++;
  }
  return bins;
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-histograms-exposure",
      "Detect Highlight Clipping in a Histogram",
      "Write a function `isHighlightClipped(histogram, thresholdPercent)` that returns `true` if bin 255 contains more than `thresholdPercent` percent of total pixels. Return `false` otherwise.",
      `function isHighlightClipped(histogram, thresholdPercent) {
  const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
  if (totalPixels === 0) return false;
  const clippedRatio = (histogram[255] / totalPixels) * 100;
  return clippedRatio > thresholdPercent;
}

const histNormal = new Array(256).fill(10);
const histBlown = new Array(256).fill(5);
histBlown[255] = 500; // Major clipping

console.log(isHighlightClipped(histNormal, 5));
console.log(isHighlightClipped(histBlown, 5));`,
      "media-histograms",
      "Highlight clipping identified from histogram bin 255.",
      [
        "Compute totalPixels by summing the histogram array.",
        "Calculate (histogram[255] / totalPixels) * 100.",
        "Return whether the percentage exceeds thresholdPercent.",
      ],
      "Beginner",
      `function isHighlightClipped(histogram, thresholdPercent) {
  const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
  if (totalPixels === 0) return false;
  const clippedRatio = (histogram[255] / totalPixels) * 100;
  return clippedRatio > thresholdPercent;
}

const histNormal = new Array(256).fill(10);
const histBlown = new Array(256).fill(5);
histBlown[255] = 500; // Major clipping

console.log(isHighlightClipped(histNormal, 5));
console.log(isHighlightClipped(histBlown, 5));`,
      [
        {
          id: "tc-media-clip-1",
          label: "Detects blown highlights accurately",
          stdin: "",
          expectedStdout: "false\ntrue",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What does a heavy spike at index 0 of an image histogram indicate?",
      "Shadow clipping (crushed blacks), meaning dark detail has been completely lost to pure black.",
    ),
    exampleRun: exampleRun("false\ntrue"),
  },
  {
    id: "media-curves-levels-balance",
    order: 4,
    title: "Contrast Curves and White Balance Gains",
    summary: "Master core concepts and hands-on engineering techniques for contrast curves and white balance gains.",
    type: "guided-coding",
    objectiveIds: ["media-tone-curves"],
    prerequisiteLessonIds: ["media-histograms-exposure"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Adjust Contrast and individual Red/Green/Blue channel multipliers.",
    },
    content: `While exposure simply offsets brightness linearly, **Contrast** expands the distance between shadows and highlights relative to the middle-gray pivot point (128).

### Linear Contrast Scaling
$$V' = (V - 128) \\times C + 128$$
- When Contrast $C > 1.0$: Values above 128 are pushed brighter; values below 128 are pushed darker, creating a punchier image.
- When Contrast $C < 1.0$: Values compress toward neutral gray.

### White Balance and Channel Gains
Illumination color temperature affects scene color (e.g. warm tungsten light casts yellow/orange; overcast sky casts cool blue). **White Balance** multiplies independent color channels by scale factors ($k_R, k_G, k_B$) to restore neutral white:
\`\`\`javascript
r' = Math.min(255, Math.max(0, r * gainR));
g' = Math.min(255, Math.max(0, g * gainG));
b' = Math.min(255, Math.max(0, b * gainB));
\`\`\``,
    theorySections: [
      {
        title: "The S-Curve in Tone Mapping",
        id: "photo-editing-media-sec-7",
        content: `Linear contrast multiplication can cause harsh clipping at the extremes. Professional photography tools utilize smooth cubic splines or sigmoidal S-curves that compress shadows and highlights smoothly (roll-off) while steepening slope through the midtones.`,
      },
      {
        title: "The Von Kries Chromatic Adaptation Model",
        id: "photo-editing-media-sec-8",
        content: `The human visual system automatically adapts to ambient illumination, making a white paper sheet appear white under both incandescent lighting and midday sun. In digital photography, von Kries adaptation simulates this by scaling cone response gains independently.`,
      },
    ],
    codeExamples: [
      {
        title: "Applying Contrast Adjustment",
        description: "Adjusts pixel contrast around midpoint 128 with clamping.",
        code: `function applyContrast(val, contrastFactor) {
  const adjusted = (val - 128) * contrastFactor + 128;
  return Math.min(255, Math.max(0, Math.round(adjusted)));
}

console.log("Dark pixel (80) with 1.5x contrast:", applyContrast(80, 1.5));   // 56
console.log("Light pixel (180) with 1.5x contrast:", applyContrast(180, 1.5)); // 206`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-curves-levels-balance",
      "Apply Contrast and Channel Gain",
      "Write a function `adjustPixel(colorVal, contrast, gain)` that first multiplies `colorVal` by `gain`, then applies contrast around midpoint 128: `((val * gain) - 128) * contrast + 128`, clamped to [0, 255] and rounded.",
      `function adjustPixel(colorVal, contrast, gain) {
  const scaled = colorVal * gain;
  const contrasted = (scaled - 128) * contrast + 128;
  return Math.min(255, Math.max(0, Math.round(contrasted)));
}

console.log(adjustPixel(100, 1.2, 1.0));
console.log(adjustPixel(200, 1.0, 1.5));`,
      "media-tone-curves",
      "Pixel adjusted with gain and contrast scaling.",
      [
        "Multiply colorVal by gain.",
        "Apply formula: ((scaled - 128) * contrast) + 128.",
        "Clamp with Math.min(255, Math.max(0, Math.round(...))).",
      ],
      "Beginner",
      `function adjustPixel(colorVal, contrast, gain) {
  const scaled = colorVal * gain;
  const contrasted = (scaled - 128) * contrast + 128;
  return Math.min(255, Math.max(0, Math.round(contrasted)));
}

console.log(adjustPixel(100, 1.2, 1.0));
console.log(adjustPixel(200, 1.0, 1.5));`,
      [
        {
          id: "tc-media-tone-1",
          label: "Calculates adjusted contrast and gain",
          stdin: "",
          expectedStdout: "94\n255",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is 128 used as the pivot point in standard contrast calculation?",
      "128 is the exact midpoint of the 8-bit dynamic range [0, 255], ensuring that midtones remain centered while highlights expand upward and shadows contract downward.",
    ),
    exampleRun: exampleRun("94\n255"),
  },

  // Module 3: Convolution Filters & Compositing
  {
    id: "media-spatial-convolutions-kernels",
    order: 5,
    title: "Spatial Convolutions and 3x3 Filter Kernels",
    summary: "Master core concepts and hands-on engineering techniques for spatial convolutions and 3x3 filter kernels.",
    type: "guided-coding",
    objectiveIds: ["media-convolutions"],
    prerequisiteLessonIds: ["media-curves-levels-balance"],
    estimatedDurationMinutes: 30,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Toggle between Sharpen, Blur, Edge Detection, and Emboss convolution kernels.",
    },
    content: `**Spatial Convolution** computes each output pixel as a weighted sum of the input pixel and its neighboring pixels using a small matrix called a **Kernel** (typically $3 \\times 3$).

### The Convolution Equation
For output pixel $(x, y)$:
$$P_{\\text{out}}(x, y) = \\sum_{ky=-1}^{1} \\sum_{kx=-1}^{1} P_{\\text{in}}(x + kx, y + ky) \\times K(kx, ky)$$

### Common 3x3 Kernels
1. **Gaussian Blur (Smoothing)**:
   \`\`\`text
   [ 1/16, 2/16, 1/16 ]
   [ 2/16, 4/16, 2/16 ]
   [ 1/16, 2/16, 1/16 ]
   \`\`\`
   Weights sum to 1.0, preserving overall image brightness while attenuating high-frequency noise.

2. **Sharpen (High-Pass Enhancement)**:
   \`\`\`text
   [  0, -1,  0 ]
   [ -1,  5, -1 ]
   [  0, -1,  0 ]
   \`\`\`
   Amplifies differences between neighboring pixels, crisping visual boundaries.

3. **Sobel / Laplacian Edge Detection**:
   \`\`\`text
   [ -1, -1, -1 ]
   [ -1,  8, -1 ]
   [ -1, -1, -1 ]
   \`\`\`
   Homogeneous regions evaluate to zero (black), while sharp gradients produce bright lines.`,
    theorySections: [
      {
        title: "Separable Convolutions (O(K^2) to O(2K))",
        id: "photo-editing-media-sec-9",
        content: `A 2D Gaussian blur kernel of size K x K requires K^2 operations per pixel. Because the 2D Gaussian function is mathematically separable (G(x,y) = G(x) * G(y)), applying a 1D horizontal blur followed by a 1D vertical blur accomplishes the exact same result in only 2K operations per pixel, running over 5x faster for 9x9 kernels.`,
      },
      {
        title: "Boundary Conditions and Padding",
        id: "photo-editing-media-sec-10",
        content: `At the image edges (x=0 or y=0), neighbor lookups fall outside the buffer. Strategies include: Clamping (duplicating the nearest border pixel), Reflection (mirroring across the edge), or Wrapping. Clamping is standard in real-time web DSP.`,
      },
    ],
    codeExamples: [
      {
        title: "Applying a 3x3 Kernel to a Pixel Neighborhood",
        description: "Calculates the weighted sum of a 3x3 neighborhood.",
        code: `function applyKernel(neighborhood, kernel) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += neighborhood[i] * kernel[i];
  }
  return Math.min(255, Math.max(0, Math.round(sum)));
}`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-spatial-convolutions-kernels",
      "Execute 3x3 Kernel Convolution",
      "Write a function `convolve3x3(patch, kernel)` that takes a 9-element array `patch` (row-major order) and a 9-element array `kernel`, calculates the weighted sum, and returns the result clamped to [0, 255] and rounded.",
      `function convolve3x3(patch, kernel) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += patch[i] * kernel[i];
  }
  return Math.min(255, Math.max(0, Math.round(sum)));
}

const flatNeighborhood = [100, 100, 100, 100, 100, 100, 100, 100, 100];
const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

console.log(convolve3x3(flatNeighborhood, edgeKernel));
console.log(convolve3x3([100, 100, 100, 100, 200, 100, 100, 100, 100], sharpenKernel));`,
      "media-convolutions",
      "3x3 spatial convolution calculated and clamped.",
      [
        "Multiply each element in patch by corresponding element in kernel.",
        "Sum all 9 products.",
        "Clamp to [0, 255] with Math.min(255, Math.max(0, Math.round(sum))).",
      ],
      "Developing",
      `function convolve3x3(patch, kernel) {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += patch[i] * kernel[i];
  }
  return Math.min(255, Math.max(0, Math.round(sum)));
}

const flatNeighborhood = [100, 100, 100, 100, 100, 100, 100, 100, 100];
const edgeKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

console.log(convolve3x3(flatNeighborhood, edgeKernel));
console.log(convolve3x3([100, 100, 100, 100, 200, 100, 100, 100, 100], sharpenKernel));`,
      [
        {
          id: "tc-media-conv-1",
          label: "Calculates correct convolution response",
          stdin: "",
          expectedStdout: "0\n255",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must the weights of a smoothing (blur) kernel sum exactly to 1.0?",
      "To preserve the total energy and overall brightness of the image; summing to > 1.0 would artificially brighten the scene.",
    ),
    exampleRun: exampleRun("0\n255"),
  },
  {
    id: "media-blend-modes-compositing",
    order: 6,
    title: "Blend Modes and Porter-Duff Alpha Compositing",
    summary: "Master core concepts and hands-on engineering techniques for blend modes and porter-duff alpha compositing.",
    type: "guided-coding",
    objectiveIds: ["media-blend-modes"],
    prerequisiteLessonIds: ["media-spatial-convolutions-kernels"],
    estimatedDurationMinutes: 25,
    interactiveDemo: {
      kind: "image-lab",
      title: "Interactive Image & Color Lab",
      description: "Explore color channel interactions and alpha transparency in procedural layers.",
    },
    content: `When compositing overlapping graphical layers, **Blend Modes** define the mathematical formula used to combine the source (top) pixel $A$ with the destination (bottom) pixel $B$.

In normalized color coordinates where channels range from $0.0$ to $1.0$:

### 1. Multiply (Darken)
$$C = A \\times B$$
Multiplying two values $\\le 1.0$ always yields a darker result. White ($1.0$) acts as an identity element and disappears completely, making Multiply ideal for removing white backgrounds.

### 2. Screen (Lighten)
$$C = 1 - (1 - A) \\times (1 - B)$$
The inverse of Multiply. Black ($0.0$) acts as an identity element and disappears, making Screen ideal for light rays and fire effects.

### 3. Normal Alpha Compositing (Porter-Duff Over)
When blending layer $A$ with opacity $\\alpha$ over destination $B$:
$$C = A \\times \\alpha + B \\times (1 - \\alpha)$$`,
    theorySections: [
      {
        title: "Straight Alpha vs Premultiplied Alpha",
        id: "photo-editing-media-sec-11",
        content: `In straight alpha, RGB values are independent of A. In premultiplied alpha, color channels are pre-scaled by alpha: (r * a, g * a, b * a). Premultiplied alpha eliminates dark fringe artifacts during bilinear filtering and allows blending operations to use single FMA (fused multiply-add) instructions.`,
      },
      {
        title: "The Overlay and Soft Light Blend Formula",
        id: "photo-editing-media-sec-12",
        content: `Overlay multiplies dark areas and screens light areas: if B < 0.5, C = 2 * A * B; else C = 1 - 2 * (1 - A) * (1 - B). This amplifies contrast while preserving underlying highlight and shadow detail.`,
      },
    ],
    codeExamples: [
      {
        title: "Multiply Blend Mode in JavaScript",
        description: "Multiplies two 8-bit color channels.",
        code: `function blendMultiply(source, destination) {
  // Normalize to [0, 1], multiply, scale back to 255
  return Math.round((source * destination) / 255);
}

console.log("Multiply White with Gray:", blendMultiply(255, 128)); // 128 (Unchanged)
console.log("Multiply Two Grays:", blendMultiply(128, 128));       // 64 (Darkened)`,
        language: "javascript",
      },
    ],
    exercise: exercise(
      "ex-media-blend-modes-compositing",
      "Implement Alpha Over Compositing",
      "Implement `alphaBlend(srcVal, dstVal, alpha)` where `srcVal` and `dstVal` are integer color values (0-255) and `alpha` is a float between 0.0 and 1.0. Formula: `Math.round(srcVal * alpha + dstVal * (1 - alpha))`. Test with (255, 0, 0.5) and (100, 200, 0.2).",
      `function alphaBlend(srcVal, dstVal, alpha) {
  return Math.round(srcVal * alpha + dstVal * (1 - alpha));
}

console.log(alphaBlend(255, 0, 0.5));
console.log(alphaBlend(100, 200, 0.2));`,
      "media-blend-modes",
      "Alpha over compositing computed accurately.",
      [
        "Use formula: Math.round(srcVal * alpha + dstVal * (1 - alpha))",
      ],
      "Beginner",
      `function alphaBlend(srcVal, dstVal, alpha) {
  return Math.round(srcVal * alpha + dstVal * (1 - alpha));
}

console.log(alphaBlend(255, 0, 0.5));
console.log(alphaBlend(100, 200, 0.2));`,
      [
        {
          id: "tc-media-blend-1",
          label: "Calculates correct alpha blended color",
          stdin: "",
          expectedStdout: "128\n180",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What color acts as the neutral identity element in the Multiply blend mode?",
      "Pure white (255 or 1.0), because multiplying any number by 1.0 leaves it unchanged.",
    ),
    exampleRun: exampleRun("128\n180"),
  },
];

// Module Groupings
export const photoEditingMediaModules: LearningModule[] = [
  moduleData(
    "media-module-pixels-color",
    1,
    "Pixels & Color Representations",
    "Master 1D RGBA memory buffers, stride calculations, color space conversions, and perceptual photometric luminance.",
    photoEditingMediaLessons.slice(0, 2),
  ),
  moduleData(
    "media-module-histograms-curves",
    2,
    "Histograms & Tonal Adjustments",
    "Analyze tonal distribution with histograms, detect clipping, and adjust contrast and white balance gains.",
    photoEditingMediaLessons.slice(2, 4),
  ),
  moduleData(
    "media-module-convolutions-compositing",
    3,
    "Convolutions & Alpha Compositing",
    "Apply 3x3 spatial convolution kernels for blur and edge detection, and compute Porter-Duff alpha blend modes.",
    photoEditingMediaLessons.slice(4, 6),
  ),
];

export const photoEditingMediaPath: LearningCourse = {
  id: "photo-editing-media",
  subjectId: photoEditingMediaSubject.id,
  title: "Computational Photography & Digital Image Processing",
  description: "Pixel buffers, RGBA color models, histograms, contrast curves, 2D convolutions, and alpha compositing.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: [
      "Basic algebra and high school coordinate geometry."
  ],
  objectives: photoEditingMediaObjectives,
  learningOutcomes: [
      "Manipulate contiguous 1D RGBA pixel buffers and calculate 2D stride offsets.",
      "Convert colors between RGB and HSL, and calculate perceptual luminance.",
      "Analyze luminance histograms and detect highlight/shadow clipping.",
      "Shape tonal distributions with contrast curves and white balance channel gains.",
      "Apply 3x3 spatial convolution kernels for blur, sharpen, and edge detection.",
      "Implement Porter-Duff alpha compositing and photometric blend modes."
  ],
  estimatedDurationMinutes: 300,
  publicationStatus: "published",
  modules: photoEditingMediaModules,
};
